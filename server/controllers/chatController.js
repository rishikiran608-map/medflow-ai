const { createClient } = require("@supabase/supabase-js");
const OpenAI = require("openai");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Fallback logic for when OpenAI API key is missing
const handleNlpFallback = async (message) => {
  const query = message.toLowerCase();

  try {
    // 1. List Doctors
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

    // 2. Check slots
    if (query.includes("slot") || query.includes("time") || query.includes("when") || query.includes("avail")) {
      const { data: doctors } = await supabase
        .from("doctors")
        .select("*")
        .eq("available", true);

      if (!doctors || doctors.length === 0) {
        return "There are no doctors available to show slots for.";
      }

      // Default to the first doctor if none specified
      let selectedDoctor = doctors[0];
      for (const doc of doctors) {
        if (query.includes(doc.name.toLowerCase()) || query.includes(doc.specialty.toLowerCase())) {
          selectedDoctor = doc;
          break;
        }
      }

      // Get appointments for the doctor today to filter slots
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

    // 3. Book appointment
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

      // Extract time (e.g. 10:00 or 14:30)
      const timeMatch = query.match(/([0-1]?[0-9]|2[0-3]):[0-5][0-9]/);
      const time = timeMatch ? timeMatch[0] : "10:00"; // default fallback

      const todayStr = new Date().toISOString().split("T")[0];

      // Perform booking insertion
      const { data: appointment, error } = await supabase
        .from("appointments")
        .insert([
          {
            doctor_id: selectedDoctor.id,
            appointment_date: todayStr,
            appointment_time: time,
            status: "Booked",
            notes: "Booked via MedFlow AI Assistant chatbot"
          }
        ])
        .select();

      if (error || !appointment || appointment.length === 0) {
        return "Apologies, booking failed. The selected time slot might already be taken.";
      }

      return `✅ Success! Your appointment has been booked with **Dr. ${selectedDoctor.name}** today at **${time}**.\n\nType *check queue* to view your live queue status!`;
    }

    // 4. Check Queue Status
    if (query.includes("queue") || query.includes("status") || query.includes("token")) {
      const todayStr = new Date().toISOString().split("T")[0];
      const { data: appointments, error } = await supabase
        .from("appointments")
        .select("*, doctors(name, specialty)")
        .eq("appointment_date", todayStr)
        .order("appointment_time", { ascending: true });

      if (error || !appointments || appointments.length === 0) {
        return "I couldn't find any active queue tokens for today.";
      }

      // Find the last booked appointment as a demo token lookup
      const myAppt = appointments[appointments.length - 1]; 
      const activeQueueCount = appointments.filter(a => a.status === "Booked").length;

      return `🟢 **Live Queue Status:**\n\n` + 
        `- Your Doctor: **Dr. ${myAppt.doctors?.name || "Available Doctor"}**\n` +
        `- Current Token Number: **#${appointments.length}**\n` +
        `- People ahead of you: **${activeQueueCount - 1}**\n` +
        `- Estimated Wait: **~${(activeQueueCount - 1) * 15} minutes**\n\n` +
        `The queue is moving smoothly!`;
    }

    // Default welcoming response
    return "👋 Hello! I am your **MedFlow AI Assistant**.\n\nI can help you manage your hospital visit. Try asking me:\n\n" +
      "1. 🩺 *\"List all available doctors\"*\n" +
      "2. 📅 *\"Show available slots for Cardiology\"*\n" +
      "3. 📝 *\"Book Dr. Smith at 10:00\"*\n" +
      "4. 🟢 *\"Check my queue status\"*";

  } catch (err) {
    console.error("NLP fallback error:", err);
    return "I encountered a slight error parsing your request. Let's try again! 🩺";
  }
};

// Main chat route controller
const handleChat = async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  const updatedHistory = [...(history || []), { role: "user", content: message }];

  // If OpenAI key is set, use gpt-4o-mini function calling
  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are the MedFlow AI assistant for a hospital clinic. You help users find doctors, list available slots, book appointments, and check queue details. Be polite and concise."
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
  const reply = await handleNlpFallback(message);
  updatedHistory.push({ role: "assistant", content: reply });
  return res.json({ response: reply, history: updatedHistory });
};

module.exports = {
  handleChat
};
