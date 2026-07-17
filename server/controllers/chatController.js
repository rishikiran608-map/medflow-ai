const { createClient } = require("@supabase/supabase-js");
const OpenAI = require("openai");
const { getPatientHistory } = require("../services/queueMetadataStore");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Fallback logic for when OpenAI API key is missing
const handleNlpFallback = async (message, patientId) => {
  const query = message.toLowerCase();
  const history = await getPatientHistory(patientId);

  // Retrieve active queue status if exists
  let queueEntry = null;
  if (patientId) {
    try {
      const { data } = await supabase
        .from("queue")
        .select("*, doctors(full_name)")
        .eq("patient_id", patientId)
        .in("queue_status", ["Waiting", "On The Way", "Arriving", "Checked In", "In Consultation"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      queueEntry = data;
    } catch (err) {
      console.error("Error checking active queue in chat:", err);
    }
  }

  try {
    // 0. 🧠 AI SYMPTOM TRIAGE ENGINE — classify urgency + recommend specialist
    const symptomKeywords = [
      "pain", "ache", "fever", "cough", "cold", "headache", "dizzy", "nausea", "vomit",
      "chest", "breath", "bleeding", "rash", "swelling", "tired", "fatigue", "sore",
      "throat", "stomach", "back", "joint", "eye", "ear", "skin", "burn", "injury",
      "heart", "pressure", "sugar", "diabetes", "bp", "seizure", "unconscious", "faint",
      "hurt", "ill", "sick", "symptom", "feeling", "unwell", "body"
    ];
    const isSymptomQuery = symptomKeywords.some(kw => query.includes(kw));

    if (isSymptomQuery) {
      // Urgency classification
      const emergencySymptoms = ["chest pain", "can't breathe", "unconscious", "seizure", "severe bleeding", "heart attack", "stroke", "faint"];
      const urgentSymptoms = ["high fever", "vomiting", "severe pain", "difficulty breathing", "chest", "heart"];
      
      const isEmergency = emergencySymptoms.some(s => query.includes(s));
      const isUrgent = !isEmergency && urgentSymptoms.some(s => query.includes(s));

      // Specialist mapping
      const specialistMap = [
        { keywords: ["chest", "heart", "bp", "pressure", "palpitation"], specialist: "Cardiologist", icon: "❤️" },
        { keywords: ["stomach", "nausea", "vomit", "gastric", "digestion", "liver"], specialist: "Gastroenterologist", icon: "🫁" },
        { keywords: ["skin", "rash", "itch", "burn", "acne", "derma"], specialist: "Dermatologist", icon: "🧴" },
        { keywords: ["headache", "dizzy", "migraine", "seizure", "neuro", "memory"], specialist: "Neurologist", icon: "🧠" },
        { keywords: ["joint", "back", "knee", "bone", "muscle", "ortho"], specialist: "Orthopedic Surgeon", icon: "🦴" },
        { keywords: ["eye", "vision", "blur"], specialist: "Ophthalmologist", icon: "👁️" },
        { keywords: ["ear", "hearing", "throat", "nose", "ent"], specialist: "ENT Specialist", icon: "👂" },
        { keywords: ["sugar", "diabetes", "thyroid", "hormone"], specialist: "Endocrinologist", icon: "🩸" },
        { keywords: ["fever", "cold", "cough", "flu", "fatigue", "body", "tired", "sore", "pain", "ill", "sick"], specialist: "General Physician", icon: "🩺" },
      ];

      let recommendedSpecialist = { specialist: "General Physician", icon: "🩺" };
      for (const entry of specialistMap) {
        if (entry.keywords.some(kw => query.includes(kw))) {
          recommendedSpecialist = entry;
          break;
        }
      }

      let urgencyBadge, urgencyText, urgencyColor, advice;
      if (isEmergency) {
        urgencyBadge = "🚨 EMERGENCY";
        urgencyText = "Your symptoms indicate a possible medical emergency.";
        urgencyColor = "⛔";
        advice = "**Please call emergency services (108) immediately or go to the nearest Emergency Room. Do NOT wait for a regular appointment.**";
      } else if (isUrgent) {
        urgencyBadge = "⚠️ URGENT";
        urgencyText = "Your symptoms require prompt medical attention today.";
        urgencyColor = "🟠";
        advice = `Please book an **urgent appointment** with a **${recommendedSpecialist.specialist}** as soon as possible.`;
      } else {
        urgencyBadge = "✅ ROUTINE";
        urgencyText = "Your symptoms appear to be non-emergency.";
        urgencyColor = "🟢";
        advice = `A **regular consultation** with a **${recommendedSpecialist.specialist}** is recommended.`;
      }

      return `${urgencyColor} **AI Symptom Triage — ${urgencyBadge}**\n\n` +
        `${urgencyText}\n\n` +
        `**Recommended Specialist:** ${recommendedSpecialist.icon} ${recommendedSpecialist.specialist}\n\n` +
        `${advice}\n\n` +
        `*⚠️ Disclaimer: This is an AI-powered triage. Always consult a qualified doctor for accurate diagnosis.*\n\n` +
        `Would you like me to **show available slots** for a ${recommendedSpecialist.specialist}?`;
    }

    // 1. Tablet Dosage and Medication questions
    if (query.includes("tablet") || query.includes("medicine") || query.includes("dosage") || query.includes("eat") || query.includes("take") || query.includes("prescrib")) {
      const rxList = history.prescriptions || [];
      if (rxList.length === 0) {
        return "💊 You do not have any active prescription records in your profile. Please complete your consultation session first.";
      }
      return `💊 **Your Active Prescription & Dosage Schedule:**\n\n` +
        rxList.map(rx => `• **${rx.name}**: Take ${rx.dosage}`).join("\n") +
        `\n\n*Note: Follow the instructions carefully or message your doctor if symptoms persist.*`;
    }

    // 2. Queue token / present wait time / condition status check
    if (query.includes("queue") || query.includes("status") || query.includes("token") || query.includes("wait") || query.includes("condition")) {
      if (!queueEntry) {
        return "You do not have any active clinic appointments or check-ins today. Would you like to schedule one?";
      }
      return `🟢 **Your Live Queue Condition:**\n\n` +
        `- **Doctor:** Dr. ${queueEntry.doctors?.full_name || "General Doctor"}\n` +
        `- **Token Number:** #${queueEntry.token_number}\n` +
        `- **Check-in Status:** ${queueEntry.queue_status}\n` +
        `- **Est. Wait Time:** ${queueEntry.estimated_wait} mins\n\n` +
        `Please stay close to the waiting area!`;
    }

    // 2b. No-Show Risk Analysis
    if (query.includes("no-show") || query.includes("risk") || query.includes("miss") || query.includes("late") || query.includes("no show")) {
      if (!queueEntry) {
        return "You don't have an active queue entry. Book an appointment first and I can analyze your no-show risk.";
      }
      const { predictNoShowProbability } = require("../services/noShowAIService");
      const riskResult = predictNoShowProbability(queueEntry);
      const riskEmoji = riskResult.riskLevel === "High" ? "🔴" : riskResult.riskLevel === "Medium" ? "🟠" : "🟢";
      return `${riskEmoji} **AI No-Show Risk Analysis:**\n\n` +
        `- **Risk Level:** ${riskResult.riskLevel} (${riskResult.probability}% probability)\n` +
        `- **Risk Factors:**\n${riskResult.reasons.map(r => `  • ${r}`).join("\n")}\n\n` +
        `${riskResult.riskLevel === "High" ? "⚠️ Please start your commute soon to preserve your slot!" : "✅ You are on track. Keep it up!"}`;
    }

    // 3. Previous visit description / diagnosed conditions
    if (query.includes("diagnos") || query.includes("previous") || query.includes("history") || query.includes("past") || query.includes("visit")) {
      const conditions = history.medicalConditions || [];
      return `🩺 **Your Clinical Health History:**\n\n` +
        `- **Diagnosed Conditions:** ${conditions.join(", ")}\n` +
        `- **Completed Clinic Visits:** ${history.completedVisits || 4} sessions\n\n` +
        `All details are securely stored in your Electronic Health Profile.`;
    }

    // 4. List Doctors
    if (query.includes("doctor") || query.includes("doc") || query.includes("list")) {
      const { data: doctors, error } = await supabase
        .from("doctors")
        .select("*")
        .eq("available", true);

      if (error || !doctors || doctors.length === 0) {
        return "Sorry, I couldn't find any available doctors at the moment.";
      }

      let response = "🩺 Here are our available doctors today:\n\n";
      doctors.forEach((doc) => {
        response += `- **Dr. ${doc.name}** (${doc.specialty})\n`;
      });
      response += "\nWould you like to check available slots for any of them?";
      return response;
    }

    // 5. Check slots
    if (query.includes("slot") || query.includes("time") || query.includes("when") || query.includes("avail")) {
      const { data: doctors } = await supabase
        .from("doctors")
        .select("*")
        .eq("available", true);

      if (!doctors || doctors.length === 0) {
        return "There are no doctors available to show slots for.";
      }

      let selectedDoctor = doctors[0];
      for (const doc of doctors) {
        if (query.includes(doc.name.toLowerCase()) || query.includes(doc.specialty.toLowerCase())) {
          selectedDoctor = doc;
          break;
        }
      }

      const todayStr = new Date().toISOString().split("T")[0];
      const { data: appointments } = await supabase
        .from("appointments")
        .select("appointment_time")
        .eq("doctor_id", selectedDoctor.id)
        .eq("appointment_date", todayStr);

      const bookedTimes = appointments ? appointments.map(a => a.appointment_time) : [];
      const potentialSlots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00"];
      const availableSlots = potentialSlots.filter(s => !bookedTimes.includes(s));

      if (availableSlots.length === 0) {
        return `All slots are booked today for Dr. ${selectedDoctor.name}. Please try booking for tomorrow!`;
      }

      return `📅 Available slots today for **Dr. ${selectedDoctor.name}** (${selectedDoctor.specialty}):\n\n` + 
        availableSlots.map(s => `• **${s}**`).join("\n") + 
        "\n\nYou can book by typing: *Book Dr. [Name] at [Time]*";
    }

    // 6. Book appointment
    if (query.includes("book") || query.includes("appoint") || query.includes("sched")) {
      const { data: doctors } = await supabase
        .from("doctors")
        .select("*")
        .eq("available", true);

      let selectedDoctor = doctors ? doctors[0] : null;
      if (doctors) {
        for (const doc of doctors) {
          if (query.includes(doc.name.toLowerCase()) || query.includes(doc.specialty.toLowerCase())) {
            selectedDoctor = doc;
            break;
          }
        }
      }

      if (!selectedDoctor) {
        return "Please specify which doctor or specialty you'd like to book.";
      }

      const timeMatch = query.match(/([0-1]?[0-9]|2[0-3]):[0-5][0-9]/);
      const time = timeMatch ? timeMatch[0] : "10:00"; 

      const todayStr = new Date().toISOString().split("T")[0];

      const { data: appointment, error } = await supabase
        .from("appointments")
        .insert([
          {
            doctor_id: selectedDoctor.id,
            appointment_date: todayStr,
            appointment_time: time,
            status: "Booked",
          }
        ])
        .select();

      if (error || !appointment || appointment.length === 0) {
        return "Apologies, booking failed. The selected time slot might already be taken.";
      }

      return `✅ Success! Your appointment has been booked with **Dr. ${selectedDoctor.name}** today at **${time}**.\n\nType *check queue* to view your live queue status!`;
    }

    // Default welcoming response
    return "👋 Hello! I am your **MedFlow AI Assistant**.\n\nI can help you manage your hospital visit. Try asking me:\n\n" +
      "1. 💊 *\"When should I take my tablets?\"*\n" +
      "2. 🟢 *\"What is my present queue condition?\"*\n" +
      "3. 🩺 *\"Show my previous visit description\"*\n" +
      "4. 📅 *\"Show available slots for Cardiologist\"*";

  } catch (err) {
    console.error("NLP fallback error:", err);
    return "I encountered a slight error parsing your request. Let's try again! 🩺";
  }
};

// Main chat route controller
const handleChat = async (req, res) => {
  const { message, history } = req.body;
  const patientId = req.user.id;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  const updatedHistory = [...(history || []), { role: "user", content: message }];

  // Retrieve active queue status for prompt injection
  let queueEntry = null;
  try {
    const { data } = await supabase
      .from("queue")
      .select("*, doctors(full_name)")
      .eq("patient_id", patientId)
      .in("queue_status", ["Waiting", "On The Way", "Arriving", "Checked In", "In Consultation"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    queueEntry = data;
  } catch (err) {
    console.error("Error reading queue context:", err);
  }

  const userHistory = await getPatientHistory(patientId);

  // If OpenAI key is set, use gpt-4o-mini
  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const systemPrompt = `You are the MedFlow AI assistant for a hospital clinic. You help patients manage appointments, prescriptions, queue status, and also perform AI symptom triage.

Patient Health Profile Context:
- Active Queue Ticket: ${queueEntry ? `#${queueEntry.token_number} for Dr. ${queueEntry.doctors?.full_name} (Status: ${queueEntry.queue_status}, Wait: ${queueEntry.estimated_wait} mins)` : 'None'}
- Diagnosed Conditions: ${(userHistory.medicalConditions || []).join(", ")}
- Active Prescriptions: ${JSON.stringify(userHistory.prescriptions || [])}
- Completed Visits: ${userHistory.completedVisits || 4}

Your capabilities:
1. SYMPTOM TRIAGE: When a patient describes symptoms, classify urgency as Emergency/Urgent/Routine, recommend the right specialist, and advise accordingly. Always add a disclaimer to see a real doctor.
2. QUEUE STATUS: Report live queue info from the context above.
3. PRESCRIPTIONS: Help with medication schedules from the prescriptions list.
4. APPOINTMENTS: Help book or check available slots.
5. NO-SHOW RISK: Warn the patient if their commute status puts them at risk of missing their appointment.

Be concise, warm, and professional. Use emojis sparingly for clarity.`;


      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          ...updatedHistory.map(h => ({ role: h.role, content: h.content }))
        ]
      });

      const reply = completion.choices[0].message.content;
      updatedHistory.push({ role: "assistant", content: reply });
      return res.json({ response: reply, history: updatedHistory });

    } catch (err) {
      console.error("OpenAI execution error, falling back to NLP engine:", err);
    }
  }

  // Fallback to local NLP processor if no key is present or if OpenAI fails
  const reply = await handleNlpFallback(message, patientId);
  updatedHistory.push({ role: "assistant", content: reply });
  return res.json({ response: reply, history: updatedHistory });
};

module.exports = {
  handleChat
};
