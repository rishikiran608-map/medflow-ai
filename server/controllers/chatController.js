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
  const history = getPatientHistory(patientId);

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
    // 1. Tablet Dosage and Medication questions
    if (query.includes("tablet") || query.includes("medicine") || query.includes("dosage") || query.includes("eat") || query.includes("take") || query.includes("prescrib")) {
      const rxList = history.prescriptions || [];
      if (rxList.length === 0) {
        return "💊 You do not have any active prescription records in your profile. Please complete your consultation session first.";
      }
      return `💊 **Your Active Prescription & Dosage Schedule:**\n\n` +
        rxList.map(rx => `• **${rx.name}**: Take ${rx.dosage}`).join("\n") +
        `\n\n*Note: Follow the instructions carefully or message Dr. Kumar if symptoms persist.*`;
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

  const userHistory = getPatientHistory(patientId);

  // If OpenAI key is set, use gpt-4o-mini
  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const systemPrompt = `You are the MedFlow AI assistant for a hospital clinic. You help patients manage appointments, prescriptions, and queue status.
Patient Health Profile Context:
- Active Queue Ticket: ${queueEntry ? `#${queueEntry.token_number} for Dr. ${queueEntry.doctors?.full_name} (Status: ${queueEntry.queue_status}, Wait: ${queueEntry.estimated_wait} mins)` : 'None'}
- Diagnosed Conditions: ${(userHistory.medicalConditions || []).join(", ")}
- Active Prescriptions: ${JSON.stringify(userHistory.prescriptions || [])}
- Completed Visits: ${userHistory.completedVisits || 4}

Provide concise, polite, and reassuring guidance. When explaining medicine intake or queue waiting times, refer to the exact values in the profile context above.`;

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
