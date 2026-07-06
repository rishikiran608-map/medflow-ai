const supabase = require("../config/supabase");
const { supabaseAdmin } = require("../config/supabase");
const {
  calculateWaitingTime,
  calculateTravelETA,
} = require("../services/queuePredictionService");
const {
  setMetadata,
  getMetadata,
  clearMetadata,
  updatePatientHistory,
} = require("../services/queueMetadataStore");
const { sendWhatsAppNotification } = require("../services/whatsappService");
const { sendEmailNotification } = require("../services/emailService");

// 1. Get all queue entries (merged with metadata)
const getQueue = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("queue")
      .select("*, patients(full_name), doctors(full_name)")
      .order("token_number");

    if (error) return res.status(500).json(error);

    const enhancedQueue = await Promise.all(
      data.map(async (item) => ({
        ...item,
        ...(await getMetadata(item.id, item.patient_id)),
      }))
    );

    res.json(enhancedQueue);
  } catch (err) {
    console.error("getQueue error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// 2. Add Patient to Queue (initial helper)
const addToQueue = async (req, res) => {
  const {
    patient_id,
    doctor_id,
    token_number,
    estimated_wait,
    queue_status,
  } = req.body;
  
  try {
    const { data, error } = await supabaseAdmin
      .from("queue")
      .insert([
        {
          patient_id,
          doctor_id,
          token_number,
          estimated_wait,
          queue_status: queue_status || "Waiting",
        },
      ])
      .select()
      .single();

    if (error) return res.status(500).json(error);

    res.status(201).json(data);
  } catch (err) {
    console.error("addToQueue error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// 3. AI Prediction Endpoint
const predictQueue = async (req, res) => {
  try {
    const result = await calculateWaitingTime(req.params.doctorId);
    res.json({
      success: true,
      prediction: result,
    });
  } catch (err) {
    res.status(500).json(err);
  }
};

// 4. Get Active Queue entry for patient (merged with metadata)
const getActiveQueue = async (req, res) => {
  const patient_id = req.user.id;
  try {
    const { data: queueEntries, error } = await supabaseAdmin
      .from("queue")
      .select("*, doctors(full_name, specialization)")
      .eq("patient_id", patient_id)
      .in("queue_status", ["Waiting", "On The Way", "Arriving", "Checked In", "In Consultation"])
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) return res.status(500).json(error);

    if (!queueEntries || queueEntries.length === 0) {
      return res.status(404).json({ success: false, message: "No active queue entry found" });
    }

    const item = queueEntries[0];
    const metadata = await getMetadata(item.id, item.patient_id);
    const enhanced = {
      ...item,
      ...metadata,
    };

    res.json(enhanced);
  } catch (err) {
    console.error("getActiveQueue error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// 5. Update status to 'Arriving' (I'm On The Way check-in with dynamic ETA estimation)
const updateOnTheWay = async (req, res) => {
  const patient_id = req.user.id;
  const { travel_mode, distance } = req.body; // e.g. 'Driving', distance in km (e.g. 5.5)

  if (!travel_mode || !distance) {
    return res.status(400).json({ success: false, message: "Travel mode and distance are required" });
  }

  try {
    const { data: activeQueue, error: fetchErr } = await supabaseAdmin
      .from("queue")
      .select("id, token_number, doctor_id")
      .eq("patient_id", patient_id)
      .eq("queue_status", "Waiting")
      .order("created_at", { ascending: false })
      .limit(1);

    if (fetchErr || !activeQueue || activeQueue.length === 0) {
      return res.status(404).json({ success: false, message: "No waiting queue entry found for this patient" });
    }

    const queueId = activeQueue[0].id;
    const doctorId = activeQueue[0].doctor_id;

    // Calculate dynamic ETA using prediction model
    const travelMetrics = calculateTravelETA(travel_mode, Number(distance));

    // Update state to Arriving
    const { error: updateErr } = await supabaseAdmin
      .from("queue")
      .update({ queue_status: "Arriving" })
      .eq("id", queueId);

    if (updateErr) return res.status(500).json(updateErr);

    // Save dynamic ETA results in metadata store
    setMetadata(queueId, {
      travel_mode,
      eta_minutes: travelMetrics.durationMinutes,
      eta_timestamp: travelMetrics.etaTimestamp,
    });

    // Notify patient
    const { data: patient } = await supabaseAdmin.from("patients").select("full_name").eq("id", patient_id).single();
    const { data: doctor } = await supabaseAdmin.from("doctors").select("full_name").eq("id", doctorId).single();
    if (patient && doctor) {
      const msg = `Hello ${patient.full_name}, we've received your status: On The Way. Mode: ${travel_mode}. ETA: ${travelMetrics.durationMinutes} mins. Dr. ${doctor.full_name}'s dashboard has been updated.`;
      sendWhatsAppNotification(patient.phone || "N/A", msg);
    }

    res.json({
      success: true,
      message: "Status updated to Arriving",
      eta_minutes: travelMetrics.durationMinutes,
      eta_timestamp: travelMetrics.etaTimestamp,
    });
  } catch (err) {
    console.error("updateOnTheWay error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// 6. Check-in patient (Patient has arrived at clinic, supports direct QR/queueId checks)
const checkInPatient = async (req, res) => {
  const patient_id = req.user.id;
  const { queueId } = req.body;

  try {
    let queueEntry;

    if (queueId) {
      const { data, error } = await supabaseAdmin
        .from("queue")
        .select("id, token_number, doctor_id, estimated_wait, patient_id")
        .eq("id", queueId)
        .single();
      
      if (error || !data) {
        return res.status(404).json({ success: false, message: "Queue token ID not found" });
      }
      queueEntry = data;
    } else {
      const { data: activeQueue, error: fetchErr } = await supabaseAdmin
        .from("queue")
        .select("id, token_number, doctor_id, estimated_wait, patient_id")
        .eq("patient_id", patient_id)
        .in("queue_status", ["Waiting", "Arriving"])
        .order("created_at", { ascending: false })
        .limit(1);

      if (fetchErr || !activeQueue || activeQueue.length === 0) {
        return res.status(404).json({ success: false, message: "No active queue entry found to check-in" });
      }
      queueEntry = activeQueue[0];
    }

    // Update status in db to Checked In
    const { error: updateErr } = await supabaseAdmin
      .from("queue")
      .update({ queue_status: "Checked In" })
      .eq("id", queueEntry.id);

    if (updateErr) return res.status(500).json(updateErr);

    // Save arrival timestamp in metadata
    setMetadata(queueEntry.id, { arrived_at: new Date().toISOString() });

    // Send check-in SMS
    const { data: patient } = await supabaseAdmin.from("patients").select("full_name, phone").eq("id", queueEntry.patient_id).single();
    if (patient) {
      const msg = `Welcome to the clinic, ${patient.full_name}! You are now checked-in. Token #${queueEntry.token_number}. Est. Wait: ${queueEntry.estimated_wait} mins. Please wait in the lounge.`;
      sendWhatsAppNotification(patient.phone || "N/A", msg);
    }

    res.json({ success: true, message: "Successfully checked in patient!" });
  } catch (err) {
    console.error("checkInPatient error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// 7. Call Next Patient (Doctor calls the next checked-in patient, skips late ones)
const callNextPatient = async (req, res) => {
  const doctor_id = req.user.id;
  try {
    // Fetch all checked-in or arriving patients for this doctor ordered by token
    const { data: queueList, error: fetchErr } = await supabaseAdmin
      .from("queue")
      .select("*, patients(full_name, email, phone)")
      .eq("doctor_id", doctor_id)
      .in("queue_status", ["Checked In", "Waiting", "Arriving"])
      .order("token_number");

    if (fetchErr) return res.status(500).json(fetchErr);

    if (!queueList || queueList.length === 0) {
      return res.status(404).json({ success: false, message: "No waiting or checked-in patients in queue" });
    }

    // Smart Queue: If the first patient is not checked in, skip them for the next checked-in patient
    const firstPatient = queueList[0];
    let targetPatient = firstPatient;

    if (firstPatient.queue_status !== "Checked In") {
      const nextCheckedIn = queueList.find(item => item.queue_status === "Checked In");
      if (nextCheckedIn) {
        targetPatient = nextCheckedIn;
        
        // Notify skipped patient
        const skippedName = firstPatient.patients?.full_name || "Patient";
        const skippedPhone = firstPatient.patients?.phone || "N/A";
        const skipMsg = `Hello ${skippedName}, you were not checked-in at the clinic for your turn. We have called the next checked-in patient (Token #${nextCheckedIn.token_number}). Your position will be adjusted once you check in.`;
        sendWhatsAppNotification(skippedPhone, skipMsg);
      }
    }

    // Update status to In Consultation
    const { error: updateErr } = await supabaseAdmin
      .from("queue")
      .update({ queue_status: "In Consultation" })
      .eq("id", targetPatient.id);

    if (updateErr) return res.status(500).json(updateErr);

    // Shift wait times for subsequent patients
    const { data: remainingQueue } = await supabaseAdmin
      .from("queue")
      .select("*")
      .eq("doctor_id", doctor_id)
      .in("queue_status", ["Waiting", "On The Way", "Arriving", "Checked In"])
      .order("token_number");

    if (remainingQueue && remainingQueue.length > 0) {
      const averageConsultationTime = 12;
      for (let i = 0; i < remainingQueue.length; i++) {
        const entry = remainingQueue[i];
        const newWait = i * averageConsultationTime;
        await supabaseAdmin
          .from("queue")
          .update({ estimated_wait: newWait })
          .eq("id", entry.id);
      }
    }

    // Send Call Next alert
    const patientName = targetPatient.patients?.full_name || "Patient";
    const patientPhone = targetPatient.patients?.phone || "N/A";
    const { data: doctor } = await supabaseAdmin.from("doctors").select("full_name").eq("id", doctor_id).single();
    const doctorName = doctor?.full_name || "Doctor";

    const msg = `Hello ${patientName}, Dr. ${doctorName} is ready to see you now! Please proceed to Consultation Room immediately (Token: #${targetPatient.token_number}).`;
    sendWhatsAppNotification(patientPhone, msg);

    res.json({ success: true, message: `Called Patient ${patientName}`, patient: targetPatient });
  } catch (err) {
    console.error("callNextPatient error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// 8. Complete Consultation (Marks In Consultation patient completed, shifts wait times)
const completeConsultation = async (req, res) => {
  const { id } = req.params;
  try {
    const { data: queueEntry, error: fetchErr } = await supabaseAdmin
      .from("queue")
      .select("*, patients(*), doctors(*)")
      .eq("id", id)
      .single();

    if (fetchErr || !queueEntry) {
      return res.status(404).json({ success: false, message: "Queue entry not found" });
    }

    const { doctor_id, patient_id, appointment_id } = queueEntry;
    const { prescription, diagnosis } = req.body;

    // Save prescription into appointment notes and patient history cache
    if (patient_id && (prescription || diagnosis)) {
      await updatePatientHistory(patient_id, {
        prescriptions: prescription || [],
        medicalConditions: diagnosis ? [diagnosis] : [],
        completedVisits: 5,
        doctorId: doctor_id,
      });
    }

    // Trigger WhatsApp notification for Completed Consultation
    const patientPhone = queueEntry.patients?.phone || "9988776655";
    const patientName = queueEntry.patients?.full_name || "Patient";
    const doctorName = queueEntry.doctors?.full_name || "Doctor";
    const fee = queueEntry.doctors?.consultation_fee || 150;

    let rxText = "";
    if (prescription && prescription.length > 0) {
      rxText = prescription.map(p => `- ${p.name}: ${p.dosage}`).join("\n");
    } else {
      rxText = "- General Checkup Consultation (No active medication prescribed)";
    }

    const whatsAppMessage = `✅ Consultation Completed!

Dear ${patientName}, your session with Dr. ${doctorName} has been concluded.

📋 DIGITAL PRESCRIPTION & DOSAGE:
${rxText}

💳 BILLING INVOICE DETAILS:
- Consultation Fee: $${fee}.00
- Payment Mode: Auto-debited (Co-pay)
- Invoice ID: INV-${id.substring(0,8).toUpperCase()}
- Status: PAID

🌿 "Your health is your greatest wealth. Wishing you a speedy recovery!" - MedFlow AI Team`;

    sendWhatsAppNotification(patientPhone, whatsAppMessage);

    // Update entry to Completed
    const { error: updateErr } = await supabaseAdmin
      .from("queue")
      .update({ queue_status: "Completed", estimated_wait: 0 })
      .eq("id", id);

    if (updateErr) return res.status(500).json(updateErr);

    // Clear metadata
    clearMetadata(id);

    // Fetch remaining waiting/arriving/checked-in patients to shift queue times
    const { data: remainingQueue, error: remainingErr } = await supabaseAdmin
      .from("queue")
      .select("*, patients(full_name, phone, email)")
      .eq("doctor_id", doctor_id)
      .in("queue_status", ["Waiting", "On The Way", "Arriving", "Checked In"])
      .order("token_number");

    if (remainingErr) {
      console.error("Error fetching remaining queue:", remainingErr.message);
    } else if (remainingQueue && remainingQueue.length > 0) {
      const averageConsultationTime = 12;
      for (let i = 0; i < remainingQueue.length; i++) {
        const entry = remainingQueue[i];
        const newWait = i * averageConsultationTime;
        await supabaseAdmin
          .from("queue")
          .update({ estimated_wait: newWait })
          .eq("id", entry.id);
      }

      // Send simulated alerts to the new front-of-queue patients
      Promise.resolve().then(async () => {
        try {
          const { data: doctor } = await supabaseAdmin.from("doctors").select("full_name").eq("id", doctor_id).single();
          if (!doctor) return;

          // 1. Patient next in line (remainingQueue[0] is now position 0!)
          // If they are checked in, alert them they are next
          const nextCall = remainingQueue[0];
          if (nextCall && nextCall.patients) {
            const msg = `Hello ${nextCall.patients.full_name}, your consultation with Dr. ${doctor.full_name} is starting next. Please stand by (Token: #${nextCall.token_number}).`;
            sendWhatsAppNotification(nextCall.patients.phone || "N/A", msg);
          }
        } catch (err) {
          console.error("Queue shift notifications error:", err);
        }
      });
    }

    res.json({ success: true, message: "Consultation completed and queue updated" });
  } catch (err) {
    console.error("completeConsultation error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// 9. Cancel Appointment (Patient cancels appointment, shifts queue wait times)
const cancelAppointment = async (req, res) => {
  const { id } = req.params; // queue entry id
  try {
    const { data: queueEntry, error: fetchErr } = await supabaseAdmin
      .from("queue")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !queueEntry) {
      return res.status(404).json({ success: false, message: "Queue entry not found" });
    }

    const { doctor_id, appointment_id } = queueEntry;

    // Update queue status to Cancelled
    const { error: queueErr } = await supabaseAdmin
      .from("queue")
      .update({ queue_status: "Cancelled", estimated_wait: 0 })
      .eq("id", id);

    if (queueErr) return res.status(500).json(queueErr);

    // Update appointment status to Cancelled
    await supabaseAdmin
      .from("appointments")
      .update({ status: "Cancelled" })
      .eq("id", appointment_id);

    // Clear metadata
    clearMetadata(id);

    // Shift wait times for subsequent patients
    const { data: remainingQueue } = await supabaseAdmin
      .from("queue")
      .select("*")
      .eq("doctor_id", doctor_id)
      .in("queue_status", ["Waiting", "On The Way", "Arriving", "Checked In"])
      .order("token_number");

    if (remainingQueue && remainingQueue.length > 0) {
      const averageConsultationTime = 12;
      for (let i = 0; i < remainingQueue.length; i++) {
        const entry = remainingQueue[i];
        const newWait = i * averageConsultationTime;
        await supabaseAdmin
          .from("queue")
          .update({ estimated_wait: newWait })
          .eq("id", entry.id);
      }
    }

    res.json({ success: true, message: "Appointment cancelled and queue shifted" });
  } catch (err) {
    console.error("cancelAppointment error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// 10. Get Queue details for Doctor dashboard (ordered by status and token)
const getDoctorQueue = async (req, res) => {
  const doctor_id = req.user.id;
  try {
    const { data, error } = await supabaseAdmin
      .from("queue")
      .select("*, patients(full_name, email, phone, age, gender)")
      .eq("doctor_id", doctor_id)
      .in("queue_status", ["Waiting", "On The Way", "Arriving", "Checked In", "In Consultation"])
      .order("token_number");

    if (error) return res.status(500).json(error);

    const enhanced = await Promise.all(
      data.map(async (item) => ({
        ...item,
        ...(await getMetadata(item.id, item.patient_id)),
      }))
    );

    res.json(enhanced);
  } catch (err) {
    console.error("getDoctorQueue error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// 11. Seed Showcase Demo Data (creates 6 doctors, 8 patients, populated active queues)
const seedDemoData = async (req, res) => {
  try {
    // A. Clean slate to prevent foreign key errors and start fresh
    await supabaseAdmin.from("queue").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    
    try {
      await supabaseAdmin.from("prescriptions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabaseAdmin.from("patient_medical_records").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    } catch (e) {
      console.log("EHR tables cleanup skipped (might not exist yet):", e.message);
    }

    await supabaseAdmin.from("appointments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("doctors").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // Fetch existing doctor auth ID if it exists to preserve relation continuity
    let docKumarId = undefined;
    try {
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
      const existingDocUser = listData?.users?.find(u => u.email === "doctor@medflow.com");
      if (existingDocUser) {
        docKumarId = existingDocUser.id;
        console.log("Found existing doctor auth user ID:", docKumarId);
      }
    } catch (e) {
      console.warn("Failed to fetch doctor user list during seed:", e.message);
    }

    const mockDocs = [
      { 
        ...(docKumarId && { id: docKumarId }),
        full_name: "Dr. Rajesh Kumar", 
        email: "doctor@medflow.com",
        specialization: "Cardiology", 
        qualification: "MD, DM", 
        consultation_fee: 250, 
        available: true 
      },
      { full_name: "Dr. Sarah Patel", specialization: "Pediatrics", qualification: "MD, DCH", consultation_fee: 220, available: true },
      { full_name: "Dr. Amit Sharma", specialization: "Orthopedics", qualification: "MS, MCh", consultation_fee: 280, available: true },
      { full_name: "Dr. Emily Watson", specialization: "Dermatology", qualification: "MD, DVD", consultation_fee: 240, available: true },
      { full_name: "Dr. Vikram Iyer", specialization: "General Medicine", qualification: "MD, FCGP", consultation_fee: 200, available: true },
      { full_name: "Dr. Sophia Chen", specialization: "Neurology", qualification: "MD, DM (Neuro)", consultation_fee: 300, available: true },
      { full_name: "Dr. Sanjay Gupta", specialization: "Oncology", qualification: "MD, DM (Onco)", consultation_fee: 350, available: true },
      { full_name: "Dr. Priya Nair", specialization: "Gynecology", qualification: "MD, DGO", consultation_fee: 260, available: true }
    ];

    const { data: insertedDocs, error: docErr } = await supabaseAdmin.from("doctors").insert(mockDocs).select();
    if (docErr) throw docErr;

    const docKumar = insertedDocs.find(d => d.specialization === "Cardiology");
    const docPatel = insertedDocs.find(d => d.specialization === "Pediatrics");
    const docSharma = insertedDocs.find(d => d.specialization === "Orthopedics");
    const docWatson = insertedDocs.find(d => d.specialization === "Dermatology");

    // B. Find or insert mock patients
    const mockPatients = [
      { full_name: "Aarav Mehta", email: "aarav@example.com", phone: "9876543210", age: 34, gender: "Male", address: "Mumbai, India" },
      { full_name: "Priya Sharma", email: "priya@example.com", phone: "9876543211", age: 28, gender: "Female", address: "Delhi, India" },
      { full_name: "Rohan Das", email: "rohan@example.com", phone: "9876543212", age: 45, gender: "Male", address: "Kolkata, India" },
      { full_name: "Ananya Iyer", email: "ananya@example.com", phone: "9876543213", age: 22, gender: "Female", address: "Chennai, India" },
      { full_name: "Vikram Singh", email: "vikram@example.com", phone: "9876543214", age: 52, gender: "Male", address: "Bangalore, India" },
      { full_name: "Sneha Reddy", email: "sneha@example.com", phone: "9876543215", age: 29, gender: "Female", address: "Hyderabad, India" },
      { full_name: "Arjun Gupta", email: "arjun@example.com", phone: "9876543216", age: 31, gender: "Male", address: "Pune, India" },
      { full_name: "Kirti Joshi", email: "kirti@example.com", phone: "9876543217", age: 26, gender: "Female", address: "Ahmedabad, India" },
      { full_name: "Rishi Kiran", email: "rishi@example.com", phone: "9876543218", age: 24, gender: "Male", address: "Kochi, India" },
      { full_name: "Rahul Nair", email: "rahul@example.com", phone: "9876543219", age: 32, gender: "Male", address: "Chennai, India" },
      { full_name: "Devika Sen", email: "devika@example.com", phone: "9876543220", age: 27, gender: "Female", address: "Kolkata, India" },
      { full_name: "Maya Roy", email: "maya@example.com", phone: "9876543221", age: 39, gender: "Female", address: "New Delhi, India" }
    ];

    const patientIds = [];
    for (const p of mockPatients) {
      const { data: existingPat } = await supabaseAdmin.from("patients").select("id").eq("email", p.email).limit(1);
      if (existingPat && existingPat.length > 0) {
        patientIds.push(existingPat[0].id);
      } else {
        const { data: insertedPat, error: patErr } = await supabaseAdmin.from("patients").insert([p]).select().single();
        if (patErr) throw patErr;
        patientIds.push(insertedPat.id);
      }
    }

    // Seed persistent patient EHR (medical records + prescriptions) in Supabase
    const patientEHRData = [
      {
        conditions: ["Hypertension", "Coronary Artery Disease"],
        prescriptions: [
          { name: "Amlodipine 5mg", dosage: "1 tablet • Morning (Daily)" },
          { name: "Aspirin 75mg", dosage: "1 tablet • Post-meal (Daily)" }
        ],
        completedVisits: 6
      },
      {
        conditions: ["Arrhythmia"],
        prescriptions: [
          { name: "Metoprolol 25mg", dosage: "1 tablet • Morning" }
        ],
        completedVisits: 3
      },
      {
        conditions: ["Type-2 Diabetes", "Mild Hyperlipidemia"],
        prescriptions: [
          { name: "Metformin 500mg", dosage: "1 tablet • Post-meal (Daily)" },
          { name: "Atorvastatin 10mg", dosage: "1 tablet • Night" }
        ],
        completedVisits: 8
      },
      {
        conditions: ["Mitral Valve Prolapse"],
        prescriptions: [
          { name: "Propranolol 10mg", dosage: "1 tablet • As needed" }
        ],
        completedVisits: 2
      },
      {
        conditions: ["Post-MI Recovery", "Angina"],
        prescriptions: [
          { name: "Clopidogrel 75mg", dosage: "1 tablet • Morning" },
          { name: "Nitroglycerin 0.5mg", dosage: "1 tablet • Sublingual (SOS)" }
        ],
        completedVisits: 10
      },
      {
        conditions: ["Allergic Asthma"],
        prescriptions: [
          { name: "Montelukast 5mg", dosage: "1 tablet • Night" },
          { name: "Albuterol Inhaler", dosage: "2 puffs • SOS" }
        ],
        completedVisits: 5
      },
      {
        conditions: ["Acute Bronchitis"],
        prescriptions: [
          { name: "Amoxicillin 250mg", dosage: "5ml syrup • Twice daily" }
        ],
        completedVisits: 4
      },
      {
        conditions: ["Mild Dermatitis"],
        prescriptions: [
          { name: "Hydrocortisone Cream 1%", dosage: "Apply twice daily" }
        ],
        completedVisits: 3
      },
      {
        conditions: ["Seasonal Allergy"],
        prescriptions: [
          { name: "Cetirizine 10mg", dosage: "1 tablet • Night" }
        ],
        completedVisits: 1
      },
      {
        conditions: ["Gastroesophageal Reflux Disease"],
        prescriptions: [
          { name: "Omeprazole 20mg", dosage: "1 tablet • Before breakfast" }
        ],
        completedVisits: 4
      },
      {
        conditions: ["Vitamin D Deficiency"],
        prescriptions: [
          { name: "Cholecalciferol 60K", dosage: "1 tablet • Weekly" }
        ],
        completedVisits: 2
      },
      {
        conditions: ["Hypothyroidism"],
        prescriptions: [
          { name: "Levothyroxine 50mcg", dosage: "1 tablet • Morning" }
        ],
        completedVisits: 12
      }
    ];

    for (let i = 0; i < patientIds.length; i++) {
      const pId = patientIds[i];
      const ehr = patientEHRData[i];
      await updatePatientHistory(pId, {
        medicalConditions: ehr.conditions,
        prescriptions: ehr.prescriptions,
        completedVisits: ehr.completedVisits,
        doctorId: null
      });
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // C. Seed active queue for Dr. Rajesh Kumar (5 patients)
    const kumarStatuses = ["In Consultation", "Checked In", "Checked In", "Checked In", "Arriving"];
    const kumarReasons = [
      "Severe chest pain and high blood pressure",
      "Regular checkup",
      "Critical cardiac evaluation",
      "Follow-up consultation",
      "General checkup"
    ];

    for (let i = 0; i < 5; i++) {
      const patientId = patientIds[i];
      const status = kumarStatuses[i];
      const reason = kumarReasons[i];

      const { data: appt } = await supabaseAdmin.from("appointments").insert([
        {
          patient_id: patientId,
          doctor_id: docKumar.id,
          appointment_date: todayStr,
          appointment_time: `10:${i}0:00`,
          status: status === "In Consultation" ? "In Consultation" : "Booked"
        }
      ]).select().single();

      const { data: qItem } = await supabaseAdmin.from("queue").insert([
        {
          patient_id: patientId,
          doctor_id: docKumar.id,
          appointment_id: appt.id,
          token_number: i + 1,
          queue_status: status,
          estimated_wait: i * 12
        }
      ]).select().single();

      setMetadata(qItem.id, { reason });

      if (status === "Arriving") {
        setMetadata(qItem.id, {
          reason,
          travel_mode: "Driving",
          eta_minutes: 14,
          eta_timestamp: new Date(Date.now() + 14 * 60 * 1000).toISOString()
        });
      }
    }

    // D. Seed active queue for Dr. Sarah Patel (3 patients)
    const patelStatuses = ["Checked In", "Waiting", "Waiting"];
    const patelReasons = [
      "Child general vaccination checkup",
      "Fever evaluation for infant",
      "Growth monitoring checkup"
    ];

    for (let i = 0; i < 3; i++) {
      const patientId = patientIds[5 + i]; // Grab Sneha, Arjun, Kirti
      const status = patelStatuses[i];
      const reason = patelReasons[i];

      const { data: appt } = await supabaseAdmin.from("appointments").insert([
        {
          patient_id: patientId,
          doctor_id: docPatel.id,
          appointment_date: todayStr,
          appointment_time: `11:${i}5:00`,
          status: "Booked"
        }
      ]).select().single();

      const { data: qItem } = await supabaseAdmin.from("queue").insert([
        {
          patient_id: patientId,
          doctor_id: docPatel.id,
          appointment_id: appt.id,
          token_number: i + 1,
          queue_status: status,
          estimated_wait: i * 15
        }
      ]).select().single();

      setMetadata(qItem.id, { reason });
    }

    // E. Seed active queue for Dr. Amit Sharma (2 patients)
    if (docSharma) {
      const sharmaStatuses = ["Checked In", "Waiting"];
      const sharmaReasons = [
        "Ligament tear follow-up check",
        "Chronic knee pain evaluation"
      ];
      for (let i = 0; i < 2; i++) {
        const patientId = patientIds[8 + i]; // Grab Rishi and Rahul
        const status = sharmaStatuses[i];
        const reason = sharmaReasons[i];

        const { data: appt } = await supabaseAdmin.from("appointments").insert([
          {
            patient_id: patientId,
            doctor_id: docSharma.id,
            appointment_date: todayStr,
            appointment_time: `12:${i}0:00`,
            status: "Booked"
          }
        ]).select().single();

        const { data: qItem } = await supabaseAdmin.from("queue").insert([
          {
            patient_id: patientId,
            doctor_id: docSharma.id,
            appointment_id: appt.id,
            token_number: i + 1,
            queue_status: status,
            estimated_wait: i * 15
          }
        ]).select().single();

        setMetadata(qItem.id, { reason });
      }
    }

    // F. Seed active queue for Dr. Emily Watson (2 patients)
    if (docWatson) {
      const watsonStatuses = ["Waiting", "Waiting"];
      const watsonReasons = [
        "Severe skin rash consultation",
        "Acne treatment follow-up"
      ];
      for (let i = 0; i < 2; i++) {
        const patientId = patientIds[10 + i]; // Grab Devika and Maya
        const status = watsonStatuses[i];
        const reason = watsonReasons[i];

        const { data: appt } = await supabaseAdmin.from("appointments").insert([
          {
            patient_id: patientId,
            doctor_id: docWatson.id,
            appointment_date: todayStr,
            appointment_time: `13:${i}5:00`,
            status: "Booked"
          }
        ]).select().single();

        const { data: qItem } = await supabaseAdmin.from("queue").insert([
          {
            patient_id: patientId,
            doctor_id: docWatson.id,
            appointment_id: appt.id,
            token_number: i + 1,
            queue_status: status,
            estimated_wait: i * 15
          }
        ]).select().single();

        setMetadata(qItem.id, { reason });
      }
    }

    res.json({ success: true, message: "Demo showcase data seeded successfully with 8 doctors and 12 patients with active queues!" });
  } catch (err) {
    console.error("seedDemoData error:", err);
    res.status(500).json({ success: false, message: "Failed to seed demo data", error: err.message });
  }
};

// 12. Register Walk-in Patient (Admins only, creates profile + places directly in queue as Checked In)
const registerWalkIn = async (req, res) => {
  if (req.user.role !== "Hospital Admin") {
    return res.status(403).json({ success: false, message: "Access denied. Admins only." });
  }

  const { full_name, phone, email, doctor_id, reason } = req.body;

  try {
    const todayStr = new Date().toISOString().split("T")[0];
    const nowTime = new Date().toTimeString().split(" ")[0];

    // 1. Find or create patient profile in patients table
    let patientId;

    // Try finding by phone or email
    const { data: existingPat } = await supabaseAdmin
      .from("patients")
      .select("*")
      .or(`phone.eq.${phone}${email ? `,email.eq.${email}` : ""}`)
      .limit(1);

    if (existingPat && existingPat.length > 0) {
      patientId = existingPat[0].id;
    } else {
      // Create new offline patient
      patientId = require("crypto").randomUUID();
      const newEmail = email || `walkin_${Date.now()}@medflow.com`;
      
      const { error: patErr } = await supabaseAdmin
        .from("patients")
        .insert([
          {
            id: patientId,
            full_name,
            phone,
            email: newEmail,
            age: 30,
            gender: "Male",
            address: "Walk-in Registration"
          }
        ]);

      if (patErr) throw patErr;
    }

    // 2. Create appointment for today
    const { data: appt, error: apptErr } = await supabaseAdmin
      .from("appointments")
      .insert([
        {
          patient_id: patientId,
          doctor_id,
          appointment_date: todayStr,
          appointment_time: nowTime,
          status: "Checked In"
        }
      ])
      .select()
      .single();

    if (apptErr) throw apptErr;

    // 3. Find next token number for this doctor
    const { data: activeQueue } = await supabaseAdmin
      .from("queue")
      .select("token_number")
      .eq("doctor_id", doctor_id)
      .order("token_number", { ascending: false })
      .limit(1);

    const nextToken = activeQueue && activeQueue.length > 0 ? activeQueue[0].token_number + 1 : 1;

    // 4. Find count of currently waiting patients to calculate estimated wait
    const { count } = await supabaseAdmin
      .from("queue")
      .select("*", { count: "exact", head: true })
      .eq("doctor_id", doctor_id)
      .in("queue_status", ["Waiting", "Arriving", "Checked In"]);

    const estWait = (count || 0) * 12;

    // 5. Place patient directly in queue as Checked In
    const { data: qItem, error: qErr } = await supabaseAdmin
      .from("queue")
      .insert([
        {
          patient_id: patientId,
          doctor_id,
          appointment_id: appt.id,
          token_number: nextToken,
          queue_status: "Checked In",
          estimated_wait: estWait
        }
      ])
      .select()
      .single();

    if (qErr) throw qErr;

    // 6. Save metadata
    setMetadata(qItem.id, {
      arrived_at: new Date().toISOString(),
      medicalConditions: ["Allergy: Penicillin", "Hypertension", "Type-2 Diabetes"],
      pastAppointments: 4
    });

    // 7. Recalculate wait times for all waiting/arriving/checked in patients
    const { data: remainingQueue } = await supabaseAdmin
      .from("queue")
      .select("*")
      .eq("doctor_id", doctor_id)
      .in("queue_status", ["Waiting", "On The Way", "Arriving", "Checked In"])
      .order("token_number");

    if (remainingQueue && remainingQueue.length > 0) {
      for (let i = 0; i < remainingQueue.length; i++) {
        const item = remainingQueue[i];
        const newWait = i * 12;
        await supabaseAdmin
          .from("queue")
          .update({ estimated_wait: newWait })
          .eq("id", item.id);
      }
    }

    // 8. Dispatch simulated SMS
    const msg = `Welcome to the clinic, ${full_name}! You have been registered as a walk-in patient. Your Token is #${nextToken}. Est. Wait: ${estWait} mins. Please wait in the lounge.`;
    sendWhatsAppNotification(phone, msg);

    res.status(201).json({
      success: true,
      message: "Walk-in patient registered and checked-in successfully!",
      token_number: nextToken,
      queue: qItem
    });
  } catch (err) {
    console.error("registerWalkIn error:", err);
    res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  }
};

module.exports = {
  getQueue,
  addToQueue,
  predictQueue,
  getActiveQueue,
  updateOnTheWay,
  checkInPatient,
  callNextPatient,
  completeConsultation,
  cancelAppointment,
  getDoctorQueue,
  seedDemoData,
  registerWalkIn,
};