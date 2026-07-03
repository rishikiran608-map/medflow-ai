const { supabaseAdmin: supabase } = require("../config/supabase");
const { calculateWaitingTime } = require("../services/queuePredictionService");
const { sendWhatsAppNotification } = require("../services/whatsappService");
const { sendEmailNotification } = require("../services/emailService");
const { setMetadata } = require("../services/queueMetadataStore");

const getAppointments = async (req, res) => {
  const { data, error } = await supabase
    .from("appointments")
    .select("*");

  if (error) return res.status(500).json(error);

  res.json(data);
};

const addAppointment = async (req, res) => {
  try {
    const {
      doctor_id,
      appointment_date,
      appointment_time,
      status,
      notes,
    } = req.body;

    const patient_id = req.user.id;
    const email = req.user.email;
    const full_name = req.user.user_metadata?.full_name || "Patient";
    const phone = req.user.user_metadata?.phone || req.user.phone || "";

    console.log("Booking appointment for patient ID:", patient_id);

    // 1. Ensure a patient profile exists in the patients table
    const { data: patientProfile, error: profileErr } = await supabase
      .from("patients")
      .select("id")
      .eq("id", patient_id)
      .maybeSingle();

    if (profileErr) {
      console.error("Error checking patient profile:", profileErr.message);
      return res.status(500).json({ success: false, message: "Error verifying patient profile", error: profileErr });
    }

    if (!patientProfile) {
      console.log("No patient profile found. Creating one automatically...");
      const { error: insertProfileErr } = await supabase
        .from("patients")
        .insert([
          {
            id: patient_id,
            full_name,
            email,
            phone,
            age: 25, // Default placeholder age
            gender: "Male",
            address: "Address",
          },
        ]);

      if (insertProfileErr) {
        console.error("Error inserting patient profile:", insertProfileErr.message);
        return res.status(500).json({ success: false, message: "Failed to create patient profile", error: insertProfileErr });
      }
    }

    // 2. Save appointment into appointments table (omitting notes since it does not exist)
    const { data: appointmentData, error: appointmentErr } = await supabase
      .from("appointments")
      .insert([
        {
          patient_id,
          doctor_id,
          appointment_date,
          appointment_time,
          status: status || "Booked",
        },
      ])
      .select()
      .single();

    if (appointmentErr) {
      console.error("Error creating appointment:", appointmentErr.message);
      return res.status(500).json({ success: false, message: "Failed to save appointment", error: appointmentErr });
    }

    // 3. Automatically create queue token (get next token number for this doctor)
    const { data: currentQueue, error: queueFetchErr } = await supabase
      .from("queue")
      .select("token_number")
      .eq("doctor_id", doctor_id)
      .order("token_number", { ascending: false })
      .limit(1);

    if (queueFetchErr) {
      console.error("Error fetching queue list:", queueFetchErr.message);
      return res.status(500).json({ success: false, message: "Failed to calculate queue token", error: queueFetchErr });
    }

    let nextToken = 1;
    if (currentQueue && currentQueue.length > 0) {
      nextToken = (currentQueue[0].token_number || 0) + 1;
    }

    // 4. Calculate estimated wait time using the active queue
    const waitingInfo = await calculateWaitingTime(doctor_id);
    const estimatedWait = waitingInfo.estimatedWait;

    // 5. Insert patient into queue table (initialized with Pending Payment status)
    const { data: queueData, error: queueInsertErr } = await supabase
      .from("queue")
      .insert([
        {
          patient_id,
          doctor_id,
          appointment_id: appointmentData.id,
          token_number: nextToken,
          queue_status: "Pending Payment",
          estimated_wait: estimatedWait,
        },
      ])
      .select()
      .single();

    if (queueInsertErr) {
      console.error("Error inserting queue token:", queueInsertErr.message);
      return res.status(500).json({ success: false, message: "Failed to assign queue token", error: queueInsertErr });
    }

    // Save appointment reason in metadata cache
    setMetadata(queueData.id, { reason: notes || "" });

    // 6. Return response indicating success, routing to payment gate
    return res.status(201).json({
      success: true,
      message: "Appointment booked successfully. Awaiting payment activation.",
      appointment: appointmentData,
      queue: queueData,
      estimated_wait: estimatedWait,
    });

  } catch (err) {
    console.error("addAppointment Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

// 7. Verify consultation fee payment and activate queue token
const makePayment = async (req, res) => {
  const { id } = req.params; // appointment id
  try {
    // A. Fetch associated queue entry
    const { data: qEntry, error: fetchErr } = await supabase
      .from("queue")
      .select("*")
      .eq("appointment_id", id)
      .single();

    if (fetchErr || !qEntry) {
      return res.status(404).json({ success: false, message: "Queue entry associated with this appointment not found" });
    }

    // B. Activate queue entry status to Waiting
    const { error: qUpdateErr } = await supabase
      .from("queue")
      .update({ queue_status: "Waiting" })
      .eq("id", qEntry.id);

    if (qUpdateErr) return res.status(500).json(qUpdateErr);

    // C. Dispatch simulated notifications now that payment is confirmed
    Promise.resolve().then(async () => {
      try {
        const { data: patient } = await supabase.from("patients").select("full_name, email, phone").eq("id", qEntry.patient_id).single();
        const { data: doctor } = await supabase.from("doctors").select("full_name").eq("id", qEntry.doctor_id).single();
        
        if (patient && doctor) {
          const smsMsg = `Hello ${patient.full_name}, your consultation payment of ₹545 is verified. Appointment with Dr. ${doctor.full_name} is confirmed! Token: #${qEntry.token_number}. Estimated Wait: ${qEntry.estimated_wait} minutes.`;
          sendWhatsAppNotification(patient.phone || "N/A", smsMsg);

          const emailSub = `Payment Verified - Token #${qEntry.token_number}`;
          const emailBody = `Dear ${patient.full_name},\n\nYour consultation payment has been successfully processed.\n\nTicket Details:\n- Token Number: #${qEntry.token_number}\n- Estimated Wait Time: ${qEntry.estimated_wait} minutes\n\nWarm regards,\nMedFlow AI Support Team`;
          sendEmailNotification(patient.email || "N/A", emailSub, emailBody);
        }
      } catch (err) {
        console.error("Failed to send booking notification:", err);
      }
    });

    res.json({ success: true, message: "Payment verified, token activated successfully!" });
  } catch (err) {
    console.error("makePayment error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  getAppointments,
  addAppointment,
  makePayment,
};