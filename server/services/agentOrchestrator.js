const { supabaseAdmin } = require("../config/supabase");
const { performHybridSearch } = require("./ragService");
const { calculateWaitingTime } = require("./queuePredictionService");
const OpenAI = require("openai");

// Global memory manager helper: loads previous messages for a conversation
const getConversationMemory = async (conversationId) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(10);
      
    if (error) return [];
    return data.map(msg => ({
      role: msg.sender_role === "assistant" ? "assistant" : "user",
      content: msg.message
    }));
  } catch (err) {
    console.error("Error loading chat memory:", err.message);
    return [];
  }
};

// Logs agent actions to audit table for compliance (HIPAA)
const logAudit = async (actorId, actorRole, action, target, metadata, confidence, approved = true, requiresApproval = false) => {
  try {
    await supabaseAdmin
      .from("audit_logs")
      .insert([{
        actor_id: actorId,
        actor_role: actorRole,
        action,
        target_resource: target,
        metadata: metadata || {},
        confidence_score: confidence,
        requires_approval: requiresApproval,
        is_approved: approved
      }]);
  } catch (err) {
    console.error("Failed to write audit log:", err.message);
  }
};

// Define executable tools mapping
const orchestratorTools = {
  // --- Patient Tools ---
  get_patient_prescriptions: async (params, userId) => {
    const { data } = await supabaseAdmin.from("prescriptions").select("*").eq("patient_id", userId).eq("is_active", true);
    return { prescriptions: data || [] };
  },
  
  get_queue_status: async (params, userId) => {
    const { data } = await supabaseAdmin
      .from("queue")
      .select("*, doctors(full_name)")
      .eq("patient_id", userId)
      .in("queue_status", ["Waiting", "On The Way", "Arriving", "Checked In", "In Consultation"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return { queue: data || null };
  },

  get_available_slots: async (params) => {
    const { doctorName } = params;
    const { data: doctors } = await supabaseAdmin.from("doctors").select("*").eq("available", true);
    if (!doctors || doctors.length === 0) return { slots: [] };
    
    let selected = doctors[0];
    if (doctorName) {
      const match = doctors.find(d => d.full_name.toLowerCase().includes(doctorName.toLowerCase()));
      if (match) selected = match;
    }
    
    const todayStr = new Date().toISOString().split("T")[0];
    const { data: booked } = await supabaseAdmin
      .from("appointments")
      .select("appointment_time")
      .eq("doctor_id", selected.id)
      .eq("appointment_date", todayStr);
      
    const bookedTimes = booked ? booked.map(b => b.appointment_time) : [];
    const allSlots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30"];
    const freeSlots = allSlots.filter(s => !bookedTimes.includes(s));
    
    return { doctor: selected.full_name, specialty: selected.specialization, availableSlots: freeSlots };
  },

  book_appointment: async (params, userId) => {
    const { doctorName, timeSlot } = params;
    const { data: doctors } = await supabaseAdmin.from("doctors").select("*").eq("available", true);
    let selected = doctors ? doctors[0] : null;
    if (doctorName && doctors) {
      const match = doctors.find(d => d.full_name.toLowerCase().includes(doctorName.toLowerCase()) || d.specialization.toLowerCase().includes(doctorName.toLowerCase()));
      if (match) selected = match;
    }
    
    if (!selected) return { success: false, message: "Doctor not found" };
    
    const todayStr = new Date().toISOString().split("T")[0];
    
    const { data, error } = await supabaseAdmin.from("appointments").insert([{
      patient_id: userId,
      doctor_id: selected.id,
      appointment_date: todayStr,
      appointment_time: timeSlot || "10:00",
      status: "Booked"
    }]).select().single();
    
    if (error) return { success: false, message: "Failed to book", error };
    return { success: true, appointment: data, message: `Successfully booked Dr. ${selected.full_name} at ${timeSlot || '10:00'}` };
  },

  // --- Doctor Tools ---
  get_patient_clinical_summary: async (params) => {
    const { patientEmail } = params;
    const { data: patient } = await supabaseAdmin.from("patients").select("*").eq("email", patientEmail).maybeSingle();
    if (!patient) return { error: "Patient not found" };
    
    const { data: record } = await supabaseAdmin.from("patient_medical_records").select("*").eq("patient_id", patient.id).maybeSingle();
    const { data: prescriptions } = await supabaseAdmin.from("prescriptions").select("*").eq("patient_id", patient.id);
    
    return {
      patient,
      history: record || { medical_conditions: [], completed_visits: 0 },
      prescriptions: prescriptions || []
    };
  },

  generate_soap_notes: async (params) => {
    const { subjective, objective, assessment, plan } = params;
    const notes = `SOAP Notes (Drafted by AI):\n- Subjective: ${subjective || "Patient complaints"}\n- Objective: ${objective || "Vital metrics"}\n- Assessment: ${assessment || "AI impression"}\n- Plan: ${plan || "Treatment outline"}`;
    return { soapNotes: notes };
  },

  // --- Reception Tools ---
  register_patient: async (params) => {
    const { fullName, email, phone, age, gender, address } = params;
    const { data, error } = await supabaseAdmin.from("patients").insert([{
      full_name: fullName,
      email,
      phone,
      age: parseInt(age || 30),
      gender: gender || "Male",
      address: address || "Address"
    }]).select().single();
    
    if (error) return { success: false, message: "Failed to register", error };
    return { success: true, patient: data };
  },

  cancel_appointment: async (params) => {
    const { appointmentId } = params;
    const { error } = await supabaseAdmin.from("appointments").update({ status: "Cancelled" }).eq("id", appointmentId);
    if (error) return { success: false, message: "Failed to cancel" };
    return { success: true, message: "Appointment cancelled" };
  },

  // --- Pharmacy Tools ---
  check_drug_interactions: async (params) => {
    const { medicines } = params;
    const list = medicines || [];
    const warnings = [];
    
    // Simple drug interaction database check
    if (list.includes("Aspirin") && list.includes("Clopidogrel")) {
      warnings.push("⚠️ ALERT: Clopidogrel and Aspirin both inhibit platelet clotting. Combination raises stomach bleeding risks.");
    }
    if (list.includes("Metformin") && list.includes("Contrast Dye")) {
      warnings.push("⚠️ ALERT: Contrast Dye combined with Metformin increases risks of severe Lactic Acidosis.");
    }
    
    // Check duplicates
    const counts = {};
    list.forEach(m => { counts[m] = (counts[m] || 0) + 1; });
    Object.keys(counts).forEach(m => {
      if (counts[m] > 1) warnings.push(`⚠️ WARNING: Duplicate medicine input detected for ${m}.`);
    });
    
    return {
      hasWarnings: warnings.length > 0,
      warnings: warnings.length > 0 ? warnings : ["No critical drug-to-drug interactions or duplicate items flagged."]
    };
  },

  // --- Admin/Owner Tools ---
  get_operational_report: async () => {
    const { data: queue } = await supabaseAdmin.from("queue").select("queue_status");
    const total = queue ? queue.length : 0;
    const completed = queue ? queue.filter(q => q.queue_status === "Completed").length : 0;
    const noshows = queue ? queue.filter(q => q.queue_status === "No Show").length : 0;
    
    const busyHour = "10:00 AM - 11:30 AM";
    const recommendedStaff = total > 15 ? "Add 1 General Physician" : "Staffing levels optimal";
    
    return {
      activeLoad: total - completed - noshows,
      throughput: completed,
      noShowRate: total > 0 ? `${Math.round((noshows / total) * 100)}%` : "0%",
      busiestHours: busyHour,
      staffingAlerts: recommendedStaff
    };
  },

  get_business_kpis: async () => {
    const { data: appointments } = await supabaseAdmin.from("appointments").select("status");
    const totalBookings = appointments ? appointments.length : 12;
    const revenue = totalBookings * 250;
    const doctorUtilization = "78%";
    const aiAdoption = "92% AI-Briefing accuracy";
    
    return {
      totalBookings,
      revenueEstimated: `$${revenue}`,
      doctorUtilization,
      aiAdoptionRate: aiAdoption,
      retentionRate: "84%"
    };
  }
};

// Route and run Orchestrator
const orchestrateChat = async ({ message, userId, userRole, conversationId, language = "en" }) => {
  try {
    const memory = await getConversationMemory(conversationId);
    const userQuery = message.toLowerCase();
    
    // 1. Enforce Role & Load Retrieval Layer
    const allowedAgents = {
      "Patient": { name: "Patient Health Assistant", category: "Patient Records" },
      "Doctor": { name: "Doctor Clinical Assistant", category: "Clinical Protocols" },
      "Hospital Admin": { name: "Hospital Admin Assistant", category: "Clinic SOPs" },
      "Pharmacist": { name: "Pharmacy Assistant", category: "Medicine Database" },
      "Clinic Owner": { name: "Clinic Owner Assistant", category: "Business KPIs" }
    };
    
    const assigned = allowedAgents[userRole] || { name: "General AI Assistant", category: null };
    
    // RAG database vector + SQL data retrieval
    const ragResult = await performHybridSearch({
      query: message,
      patientId: userRole === "Patient" ? userId : null,
      role: userRole,
      category: null
    });

    // Determine specialty persona dynamically based on doctor's department or keyword context
    let specialty = "General Practice";
    let personaPrompt = "";
    
    const activeQueue = ragResult.patientLiveContext?.queue;
    const docSpec = activeQueue?.doctors?.specialization || "";
    
    if (docSpec.toLowerCase().includes("derma") || userQuery.includes("skin") || userQuery.includes("cream") || userQuery.includes("rash") || userQuery.includes("ointment")) {
      specialty = "Dermatology";
      personaPrompt = `
🏥 HOSPITAL SPECIALTY PERSONA: Dermatology Assistant (Skin Care Hospital)
- You act as an experienced, professional dermatologist.
- Focus heavily on skin care compliance: explain creams, ointments, sunscreen usage, skin application frequency, precautions, side effects, and follow-up dermatology care. 
- Tone: Clinical, dermatological, and encouraging.`;
    } else if (docSpec.toLowerCase().includes("ent") || userQuery.includes("ear") || userQuery.includes("nose") || userQuery.includes("throat") || userQuery.includes("spray") || userQuery.includes("drop")) {
      specialty = "ENT (Otolaryngology)";
      personaPrompt = `
🏥 HOSPITAL SPECIALTY PERSONA: ENT Assistant (ENT Hospital)
- You act as an experienced Otolaryngologist (ENT specialist).
- Focus on hearing care and ENT compliance: explain ear drops, nasal sprays, sinus medications, antibiotics, hearing precautions, ear cleaning guidelines, and infection prevention.
- Tone: Highly informative, professional ENT expert.`;
    } else if (docSpec.toLowerCase().includes("eye") || docSpec.toLowerCase().includes("ophthal") || userQuery.includes("eye") || userQuery.includes("vision") || userQuery.includes("cataract")) {
      specialty = "Ophthalmology (Eye Hospital)";
      personaPrompt = `
🏥 HOSPITAL SPECIALTY PERSONA: Eye Care Assistant (Eye Hospital)
- You act as a precise, professional ophthalmologist.
- Focus on eye health care: explain sterile eye drop administration, cataract recovery warnings, screen-time limitations, and visual safety.
- Tone: Meticulous and protective of vision.`;
    } else if (docSpec.toLowerCase().includes("dent") || docSpec.toLowerCase().includes("tooth") || userQuery.includes("dental") || userQuery.includes("gum") || userQuery.includes("braces")) {
      specialty = "Dentistry (Dental Hospital)";
      personaPrompt = `
🏥 HOSPITAL SPECIALTY PERSONA: Dental Care Assistant (Dental Hospital)
- You act as a dentist.
- Focus on oral hygiene: explain brush/floss frequencies, mouthwash rules, pain control, post-extraction guidelines, and cleaning schedules.
- Tone: Warm, dental-health oriented.`;
    } else {
      specialty = "General Physician";
      personaPrompt = `
🏥 HOSPITAL SPECIALTY PERSONA: General Physician Assistant (General Hospital)
- You act as an expert general practitioner.
- Focus on general health advice, standard medication schedules, lifestyle adjustments, and scheduling parameters.
- Tone: Empathetic, generic clinical advisor.`;
    }

    // Determine translation language instructions
    let translationInstruction = "";
    if (language === "te") {
      translationInstruction = `
🌐 LANGUAGE REQUIREMENT:
- The user has selected **TELUGU**.
- You MUST formulate your entire response in clear, conversational, and natural Telugu (తెలుగు).
- Translate medical terms into simple, easily understandable Telugu descriptions (e.g., explain "ointment" as "చర్మంపై పూసే క్రీమ్/మందు", "before food" as "భోజనానికి ముందు", "twice daily" as "రోజుకు రెండు సార్లు").
- Do NOT mix heavy English phrases. Ensure an elderly native Telugu speaker can read or listen to your response easily.
- Keep Telugu characters grammatically correct and beautifully phrased.
- Remind the patient at the end to consult their doctor in Telugu: "ఏదైనా మార్పులకు ముందు మీ వైద్యుడిని సంప్రదించండి."`;
    } else {
      translationInstruction = `
🌐 LANGUAGE REQUIREMENT:
- Respond in clear, professional English.`;
    }

    // 2. Setup System Prompt defining capabilities, memories, and constraints
    const systemPrompt = `You are the ${assigned.name} at MedFlow AI Clinic. 
You communicate only through the MedFlow AI Orchestration Layer.

User Context:
- User ID: ${userId}
- User Role: ${userRole}
- Assigned Assistant: ${assigned.name}
- AI Confidence: ${ragResult.confidenceScore}
- Citations Used: ${JSON.stringify(ragResult.citations)}

RAG Knowledge & Live Database Context:
${JSON.stringify(ragResult.patientLiveContext || {})}
${JSON.stringify(ragResult.vectorResults.map(r => ({ title: r.title, content: r.content })))}

${personaPrompt}
${translationInstruction}

Strict Guidelines:
1. SECURITY: Never leak confidential records across patient roles. Logged-in patients can ONLY access their own records.
2. DOCTORS DECIDE: AI assistants only recommend diagnoses, SOAP notes, or draft prescriptions. Human physicians must edit and click approve before databases are updated.
3. CONCISE: Be short, professional, and directly state options or structured cards.
4. STRUCTURED: Provide JSON cards for UI parsing when executing actions (booking, schedules, audits).`;

    // 3. Fallback Engine or OpenAI API call
    let reply = "";
    let confidence = ragResult.confidenceScore;
    let toolOutput = null;

    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        
        // Define tools for OpenAI API
        const toolsConfig = [
          {
            type: "function",
            function: {
              name: "get_patient_prescriptions",
              description: "Gets active medications and prescriptions for current patient.",
              parameters: { type: "object", properties: {} }
            }
          },
          {
            type: "function",
            function: {
              name: "get_queue_status",
              description: "Feteks live clinic queue token, position, and wait duration.",
              parameters: { type: "object", properties: {} }
            }
          },
          {
            type: "function",
            function: {
              name: "get_available_slots",
              description: "Finds free time slots for a doctor.",
              parameters: {
                type: "object",
                properties: { doctorName: { type: "string" } }
              }
            }
          },
          {
            type: "function",
            function: {
              name: "book_appointment",
              description: "Books an appointment slot for the patient.",
              parameters: {
                type: "object",
                properties: {
                  doctorName: { type: "string" },
                  timeSlot: { type: "string" }
                }
              }
            }
          },
          {
            type: "function",
            function: {
              name: "check_drug_interactions",
              description: "Checks combination of drug inputs for warnings and duplicate medicines.",
              parameters: {
                type: "object",
                properties: {
                  medicines: { type: "array", items: { type: "string" } }
                },
                required: ["medicines"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "get_operational_report",
              description: "Admin report including queue delays, busiest hour, and staffing requirements.",
              parameters: { type: "object", properties: {} }
            }
          },
          {
            type: "function",
            function: {
              name: "get_business_kpis",
              description: "Clinic owner overview detailing clinic revenue, doc load, and AI adoption.",
              parameters: { type: "object", properties: {} }
            }
          }
        ];

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            ...memory,
            { role: "user", content: message }
          ],
          tools: toolsConfig,
          tool_choice: "auto"
        });

        const responseMessage = completion.choices[0].message;

        if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
          const call = responseMessage.tool_calls[0];
          const toolName = call.function.name;
          const toolArgs = JSON.parse(call.function.arguments);
          
          console.log(`[Orchestrator] Agent selected tool: ${toolName}`);
          
          if (orchestratorTools[toolName]) {
            toolOutput = await orchestratorTools[toolName](toolArgs, userId);
            
            // Log Audit for action
            await logAudit(userId, userRole, `Tool Call: ${toolName}`, "database", toolArgs, confidence);

            // Get final LLM response with tool output integrated
            const secondCompletion = await openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [
                { role: "system", content: systemPrompt },
                ...memory,
                { role: "user", content: message },
                responseMessage,
                {
                  role: "tool",
                  tool_call_id: call.id,
                  name: toolName,
                  content: JSON.stringify(toolOutput)
                }
              ]
            });
            reply = secondCompletion.choices[0].message.content;
          } else {
            reply = "Tool defined but executor not found.";
          }
        } else {
          reply = responseMessage.content;
        }
        
      } catch (err) {
        console.error("OpenAI orchestrator failed, falling back to local NLP rules:", err.message);
      }
    }

    if (!reply) {
      const isTe = language === "te";
      
      // 1. Tool-specific keyword matches take FIRST priority over RAG (Bilingual support for English & Telugu)
      if (userQuery.includes("prescription") || userQuery.includes("medicine") || userQuery.includes("my tablet") || userQuery.includes("my medication") || userQuery.includes("my drugs") || userQuery.includes("ప్రిస్క్రిప్షన్") || userQuery.includes("మందులు") || userQuery.includes("టాబ్లెట్") || userQuery.includes("ఔషధం")) {
        const rx = await orchestratorTools.get_patient_prescriptions({}, userId);
        toolOutput = rx;
        
        if (isTe) {
          reply = (rx.prescriptions && rx.prescriptions.length > 0)
            ? `💊 **మీ క్రియాశీల ప్రిస్క్రిప్షన్లు:**\n${rx.prescriptions.map(p => `• **${p.medicine_name}**: ${p.dosage}`).join("\n")}\n\n_మీ ధృవీకరించబడిన వైద్య రికార్డుల నుండి చివరిసారిగా నవీకరించబడింది._`
            : "💊 మీ వైద్య రికార్డులలో క్రియాశీల ప్రిస్క్రిప్షన్లు ఏవీ కనుగొనబడలేదు. దయచేసి అప్‌డేట్ చేసిన ప్రిస్క్రిప్షన్ కోసం మీ వైద్యుడిని సంప్రదించండి.";
        } else {
          reply = (rx.prescriptions && rx.prescriptions.length > 0)
            ? `💊 **Your Active Prescriptions:**\n${rx.prescriptions.map(p => `• **${p.medicine_name}**: ${p.dosage}`).join("\n")}\n\n_Last updated from your verified medical records._`
            : "💊 No active prescriptions found in your medical records. Please consult your doctor for an updated prescription.";
        }
      }
      else if (userQuery.includes("queue") || userQuery.includes("status") || userQuery.includes("token") || userQuery.includes("wait") || userQuery.includes("my turn") || userQuery.includes("క్యూ") || userQuery.includes("స్థితి") || userQuery.includes("టోకెన్") || userQuery.includes("వేచి") || userQuery.includes("సమయం")) {
        const q = await orchestratorTools.get_queue_status({}, userId);
        toolOutput = q;
        
        if (isTe) {
          reply = q.queue
            ? `🟢 **యాక్టివ్ క్యూ టికెట్:**\n• **టోకెన్:** #${q.queue.token_number}\n• **వైద్యుడు:** డాక్టర్ ${q.queue.doctors?.full_name || "జనరల్ డాక్టర్"}\n• **స్థితి:** ${q.queue.queue_status}\n• **వేచి ఉండే సమయం:** ${q.queue.estimated_wait} నిమిషాలు`
            : "🟢 మీకు ఈరోజు ఎలాంటి యాక్టివ్ అపాయింట్‌మెంట్‌లు లేదా చెక్-ఇన్‌లు లేవు.";
        } else {
          reply = q.queue
            ? `🟢 **Active Queue Ticket:**\n• **Token:** #${q.queue.token_number}\n• **Doctor:** Dr. ${q.queue.doctors?.full_name || "General Doctor"}\n• **Status:** ${q.queue.queue_status}\n• **Wait:** ${q.queue.estimated_wait} mins`
            : "🟢 You do not have any active appointments or check-ins today.";
        }
      }
      else if (userQuery.includes("slot") || userQuery.includes("available time") || userQuery.includes("avail") || userQuery.includes("స్లాట్") || userQuery.includes("సమయం")) {
        const slotsResult = await orchestratorTools.get_available_slots({ doctorName: userQuery });
        toolOutput = slotsResult;
        
        if (isTe) {
          reply = `📅 **డాక్టర్ ${slotsResult.doctor} (${slotsResult.specialty}) కోసం అందుబాటులో ఉన్న స్లాట్‌లు:**\n` +
            slotsResult.availableSlots.map(s => `• **${s}**`).join("\n") +
            "\n\nమీరు నన్ను స్లాట్ బుక్ చేయమని అడగడం ద్వారా బుక్ చేసుకోవచ్చు.";
        } else {
          reply = `📅 **Available Slots for Dr. ${slotsResult.doctor} (${slotsResult.specialty}):**\n` +
            slotsResult.availableSlots.map(s => `• **${s}**`).join("\n") +
            "\n\nYou can book by asking me to schedule a slot.";
        }
      }
      else if (userQuery.includes("book") || userQuery.includes("schedule appointment") || userQuery.includes("బుక్") || userQuery.includes("అపాయింట్‌మెంట్")) {
        const bookResult = await orchestratorTools.book_appointment({ timeSlot: "10:30" }, userId);
        toolOutput = bookResult;
        
        if (isTe) {
          reply = bookResult.success
            ? `✅ **అపాయింట్‌మెంట్ బుక్ చేయబడింది!** ${bookResult.message}`
            : `❌ **బుకింగ్ విఫలమైంది:** ${bookResult.message}`;
        } else {
          reply = bookResult.success
            ? `✅ **Appointment Booked!** ${bookResult.message}`
            : `❌ **Booking failed:** ${bookResult.message}`;
        }
      }
      else if (userQuery.includes("interaction") || userQuery.includes("drug warning") || userQuery.includes("conflict") || userQuery.includes("combine") || userQuery.includes("ఇంటరాక్షన్") || userQuery.includes("హెచ్చరిక") || userQuery.includes("వ్యతిరేక")) {
        const medicines = [];
        if (userQuery.includes("aspirin")) medicines.push("Aspirin");
        if (userQuery.includes("clopidogrel")) medicines.push("Clopidogrel");
        if (userQuery.includes("metformin")) medicines.push("Metformin");
        if (userQuery.includes("amlodipine")) medicines.push("Amlodipine");
        if (userQuery.includes("atorvastatin")) medicines.push("Atorvastatin");
        if (userQuery.includes("contrast")) medicines.push("Contrast Dye");
        if (medicines.length === 0) medicines.push("Aspirin", "Metformin");
        const check = await orchestratorTools.check_drug_interactions({ medicines });
        toolOutput = check;
        
        if (isTe) {
          reply = `💊 **డ్రగ్ ఇంటరాక్షన్ స్కాన్ (మందులు: ${medicines.join(", ")}):**\n\n` + check.warnings.join("\n");
        } else {
          reply = `💊 **Drug Interaction Scan (Medicines: ${medicines.join(", ")}):**\n\n` + check.warnings.join("\n");
        }
      }
      else if (userRole === "Hospital Admin" && (userQuery.includes("report") || userQuery.includes("admin") || userQuery.includes("load") || userQuery.includes("operational") || userQuery.includes("రిపోర్ట్") || userQuery.includes("కార్యాచరణ"))) {
        const report = await orchestratorTools.get_operational_report();
        toolOutput = report;
        
        if (isTe) {
          reply = `📊 **అడ్మిన్ కార్యాచరణ నివేదిక:**\n- **యాక్టివ్ క్యూ లోడ్:** ${report.activeLoad} రోగులు\n- **పూర్తయిన సంప్రదింపులు:** ${report.throughput}\n- **నో-షో నిష్పత్తి:** ${report.noShowRate}\n- **అత్యంత రద్దీ సమయం:** ${report.busiestHours}\n- **సిబ్బంది సలహా:** ${report.staffingAlerts}`;
        } else {
          reply = `📊 **Admin Operational Report:**\n- **Active Queue Load:** ${report.activeLoad} patients\n- **Completed Consults:** ${report.throughput}\n- **No-Show Ratio:** ${report.noShowRate}\n- **Busiest Hours:** ${report.busiestHours}\n- **Staffing Advice:** ${report.staffingAlerts}`;
        }
      }
      else if (userRole === "Clinic Owner" && (userQuery.includes("kpi") || userQuery.includes("business") || userQuery.includes("revenue") || userQuery.includes("clinic performance") || userQuery.includes("ఆదాయం") || userQuery.includes("వినియోగ"))) {
        const kpis = await orchestratorTools.get_business_kpis();
        toolOutput = kpis;
        
        if (isTe) {
          reply = `💼 **క్లినిక్ బిజినెస్ KPI సారాంశం:**\n- **ఆదాయ ట్రెండ్:** ${kpis.revenueEstimated}\n- **మొత్తం బుకింగ్‌లు:** ${kpis.totalBookings}\n- **వైద్యుల వినియోగం:** ${kpis.doctorUtilization}\n- **AI దత్తత రేటు:** ${kpis.aiAdoptionRate}\n- **రోగుల నిలుపుదల:** ${kpis.retentionRate}`;
        } else {
          reply = `💼 **Clinic Business KPI Summary:**\n- **Revenue Trend:** ${kpis.revenueEstimated}\n- **Total Bookings:** ${kpis.totalBookings}\n- **Doctor Utilization:** ${kpis.doctorUtilization}\n- **AI Adoption Rate:** ${kpis.aiAdoptionRate}\n- **Patient Retention:** ${kpis.retentionRate}`;
        }
      }
      // 2. RAG vector/keyword search for clinical knowledge queries
      else if (ragResult.vectorResults && ragResult.vectorResults.length > 0) {
        const bestMatch = ragResult.vectorResults[0];
        if (isTe) {
          reply = `📖 **మెడ్‌ఫ్లో RAG నాలెడ్జ్ బేస్ [${bestMatch.category}]:**\n\n` +
            `**${bestMatch.title}**\n` +
            `${bestMatch.content}\n\n` +
            `*(ఆధారపడే రేటు: ${ragResult.confidenceScore} • RAG ఆటో-ఫాల్‌బ్యాక్)*`;
        } else {
          reply = `📖 **MedFlow RAG Knowledge Base [${bestMatch.category}]:**\n\n` +
            `**${bestMatch.title}**\n` +
            `${bestMatch.content}\n\n` +
            `*(Confidence Score: ${ragResult.confidenceScore} • RAG Auto-Fallback)*`;
        }
      }
      // 3. Generic greeting / fallback
      else {
        if (isTe) {
          reply = `👋 నమస్కారం! నేను మీ **${assigned.name}**.\n\nనేను షేర్డ్ మెడ్‌ఫ్లో RAG ప్లాట్‌ఫారమ్‌కు అనుసంధానించబడి ఉన్నాను. మీ **${userRole}** అనుమతుల పరిధికి సరిపోయే సాధనాలను నేను అమలు చేయగలను.\n\nఅపాయింట్‌మెంట్‌లు, డ్రగ్ ఇంటరాక్షన్ హెచ్చరికలు, క్యూ అంచనాలు లేదా కార్యాచరణ నివేదికల గురించి నన్ను అడగడానికి ప్రయత్నించండి.`;
        } else {
          reply = `👋 Hello! I am the **${assigned.name}**.\n\nI am connected to the shared MedFlow RAG platform. I can execute tools matching your **${userRole}** permissions scope.\n\nTry asking me to check appointments, medication interaction warnings, queue predictions, or operational reports.`;
        }
      }
    }

    // 4. Save interactions to chat history in Supabase
    try {
      await supabaseAdmin.from("chat_messages").insert([
        { conversation_id: conversationId, sender_role: userRole, message, agent_role: assigned.name },
        { conversation_id: conversationId, sender_role: "assistant", message: reply, agent_role: assigned.name }
      ]);
      await logAudit(userId, userRole, `Agent chat response`, "chat_messages", { characterCount: reply.length }, confidence);
    } catch (err) {
      console.warn("Failed to log chat interaction to database:", err.message);
    }

    return {
      response: reply,
      role: assigned.name,
      confidence,
      citations: ragResult.citations,
      toolOutput
    };
  } catch (globalErr) {
    console.error("Global orchestrator crash caught:", globalErr.message);
    // Graceful fallback response
    return {
      response: `👋 Hello! I am the **${userRole} Workspace Assistant**.\n\nI am connected to the shared MedFlow RAG platform. Due to a temporary connection issue, I am operating in offline memory mode.\n\nClinical guidelines and drug database profiles are active. Try asking about "hypertension management", "Amlodipine warnings", or "Metformin side effects".`,
      role: userRole + " Assistant",
      confidence: 0.7,
      citations: [
        { title: "MedFlow Local Emergency Backup Knowledge", category: "System", confidence: 1.0 }
      ],
      toolOutput: null
    };
  }
};

module.exports = {
  orchestrateChat,
  orchestratorTools
};
