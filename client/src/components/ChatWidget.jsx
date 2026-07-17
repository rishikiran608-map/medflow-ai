import { useState, useEffect, useRef } from "react";
import api from "../api/api";
import { Send, Sparkles, MessageSquare, Bot, Mic, Shield, User, HelpCircle } from "lucide-react";

function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Retrieve role and name from local storage
  const role = localStorage.getItem("userRole") || "Patient";
  const userName = localStorage.getItem("userName") || "User";

  // Dynamic greetings and themes per dashboard role
  const roleConfigs = {
    "Patient": {
      agentName: "Patient Health Assistant",
      greeting: `👋 Hello ${userName}! I am your **Patient Health Assistant**.\n\nI can help you check your live wait times, review prescriptions, understand lab reports, or check symptoms. Try asking:\n\n1. 💊 *\"What is my tablet schedule?\"*\n2. 🟢 *\"Show my queue status and wait time\"*\n3. ⚠️ *\"Check drug interactions for Aspirin and Clopidogrel\"*`,
      suggestions: ["Show my prescriptions", "Check my queue status", "Drug interaction check for Aspirin"],
      themeColor: "from-blue-600 to-cyan-500",
      accent: "bg-blue-600 text-white",
      logo: "🤖"
    },
    "Doctor": {
      agentName: "Doctor Clinical Assistant",
      greeting: `🩺 Hello Doctor! I am your **Clinical Assistant**.\n\nI can search clinic treatment guidelines, compile patient history briefings, and draft SOAP clinical summaries. Try asking:\n\n1. 📊 *\"Summarize clinical history for patient@medflow.com\"*\n2. 📝 *\"Draft SOAP notes for Stage-2 Hypertension check\"*\n3. 🏥 *\"Check treatment guidelines for Type-2 Diabetes\"*`,
      suggestions: ["Summarize history for patient@medflow.com", "Draft Hypertension SOAP notes", "Diabetes guidelines"],
      themeColor: "from-teal-600 to-cyan-600",
      accent: "bg-teal-600 text-white",
      logo: "🩺"
    },
    "Hospital Admin": {
      agentName: "Reception Assistant",
      greeting: `📋 Hello! I am your **Receptionist AI Assistant**.\n\nI can schedule walk-in bookings, estimate active backlog queue wait times, or retrieve Twilio notification outbox logs. Try asking:\n\n1. 🎫 *\"Calculate queue backlog and backlog load\"*\n2. 📊 *\"Show active queue monitor report\"*\n3. 🚗 *\"Verify no-show classifier predictions\"*`,
      suggestions: ["Calculate queue backlog", "Show admin monitor report", "Commute no-show checks"],
      themeColor: "from-indigo-600 to-blue-600",
      accent: "bg-indigo-600 text-white",
      logo: "📋"
    },
    "Pharmacist": {
      agentName: "Pharmacy Assistant",
      greeting: `💊 Welcome to the Dispensary Hub. I am your **Pharmacy Assistant**.\n\nI can verify duplicate medications, audit drug combinations for warnings, or translate handwriting scans. Try asking:\n\n1. 🧪 *\"Audit Aspirin and Clopidogrel combination warnings\"*\n2. 📝 *\"Suggest generic alternatives for Lipitor\"*\n3. 📋 *\"Verify prescription dosage schedule Metformin\"*`,
      suggestions: ["Audit Aspirin + Clopidogrel warnings", "Suggest generic for Lipitor", "Dosage schedule Metformin"],
      themeColor: "from-amber-500 to-orange-500",
      accent: "bg-amber-600 text-white",
      logo: "💊"
    },
    "Clinic Owner": {
      agentName: "Clinic Owner Assistant",
      greeting: `💼 Good day, Director. I am your **Clinic Owner Assistant**.\n\nI can provide high-level summaries of business KPIs, revenue progress, doctor utilization loads, and AI adoption trends. Try asking:\n\n1. 📈 *\"Summarize clinic business KPIs and revenue\"*\n2. 🏥 *\"Show doctor utilization levels\"*\n3. 🤖 *\"Review AI queue optimization impact\"*`,
      suggestions: ["Summarize clinic business KPIs", "Show doctor utilization levels", "AI optimization impact"],
      themeColor: "from-rose-500 to-pink-500",
      accent: "bg-rose-600 text-white",
      logo: "💼"
    }
  };

  const config = roleConfigs[role] || roleConfigs["Patient"];

  // Initialize conversations
  useEffect(() => {
    setMessages([
      { role: "assistant", content: config.greeting }
    ]);
  }, [role, config.greeting]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Voice Input using Web Speech API
  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Chrome.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setTimeout(() => handleSend(transcript), 200);
    };

    recognition.start();
  };

  const handleSend = async (textToSend) => {
    const messageText = textToSend || input;
    if (!messageText.trim()) return;

    if (!textToSend) setInput("");
    setMessages((prev) => [...prev, { role: "user", content: messageText }]);
    setIsLoading(true);

    try {
      const response = await api.post("/orchestrate/chat", {
        message: messageText,
        conversationId: `chat-${role.toLowerCase().replace(" ", "-")}`
      });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.data.response },
      ]);
    } catch (err) {
      console.error("Orchestrator chat widget error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Sorry, I could not complete that query. Verify your connection or try again in a moment.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[90] font-sans">
      {/* FAB Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`w-14 h-14 bg-gradient-to-tr ${config.themeColor} rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 relative group`}
        >
          <span className="text-2xl">{config.logo}</span>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
          <span className={`absolute inset-0 rounded-full ring-4 ring-blue-400/40 animate-ping pointer-events-none`} />
          <div className="absolute right-16 bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap shadow-md">
            Ask {config.agentName}
          </div>
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="w-[360px] h-[520px] sm:w-[400px] bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden transition-all duration-500 ease-in-out transform scale-100 origin-bottom-right">
          {/* Header */}
          <div className={`bg-gradient-to-r ${config.themeColor} p-4 text-white flex justify-between items-center shadow-md`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl shadow-inner">
                {config.logo}
              </div>
              <div className="text-left">
                <h4 className="font-extrabold text-sm tracking-tight flex items-center gap-1.5">
                  {config.agentName}
                  <span className="text-[9px] bg-green-400 text-slate-950 font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                    Live
                  </span>
                </h4>
                <p className="text-[10px] text-white/80">MedFlow OS Orchestration Layer</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white hover:bg-white/10 w-8 h-8 rounded-full flex items-center justify-center transition font-bold"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 text-left">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-sm leading-relaxed whitespace-pre-line ${
                    msg.role === "user"
                      ? `${config.accent} rounded-tr-none`
                      : "bg-white text-slate-800 border border-slate-100 rounded-tl-none font-medium"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-4 py-2.5 flex gap-1.5 items-center shadow-sm">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions Chips */}
          <div className="px-4 py-2 bg-slate-50/50 border-t border-slate-100 flex gap-2 overflow-x-auto scrollbar-none whitespace-nowrap">
            {config.suggestions.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(sug)}
                className="bg-white hover:bg-blue-50/50 text-slate-600 border border-slate-200 text-[10px] font-bold px-3 py-1.5 rounded-full transition shadow-sm flex-shrink-0"
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center"
          >
            <button
              type="button"
              onClick={handleVoiceInput}
              title={isListening ? "Stop listening" : "Speak message"}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition shrink-0 ${
                isListening
                  ? "bg-red-500 text-white animate-pulse shadow-md"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {isListening ? (
                <span className="w-2.5 h-2.5 bg-white rounded-sm" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
            
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Listening..." : "Ask AI Agent or query records..."}
              className={`flex-1 border text-slate-800 placeholder-slate-400 text-xs px-4 py-2.5 rounded-xl outline-none transition ${
                isListening
                  ? "bg-red-50 border-red-300 focus:border-red-400"
                  : "bg-slate-50 border-slate-100 focus:border-blue-500 focus:bg-white"
              }`}
            />
            
            <button
              type="submit"
              className={`bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl transition text-xs shadow-md active:scale-95`}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default ChatWidget;
