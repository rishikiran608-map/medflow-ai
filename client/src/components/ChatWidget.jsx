import { useState, useEffect, useRef } from "react";
import axios from "axios";

// Determine local fallback vs cloud API URL
const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return "/api";
};

const api = axios.create({
  baseURL: getBaseURL(),
});

function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "👋 Hello! I am your **MedFlow AI Assistant**.\n\nI can help you manage your hospital visit. Try asking me:\n\n1. 🩺 *\"List all available doctors\"*\n2. 📅 *\"Show available slots for Cardiology\"*\n3. 📝 *\"Book Dr. Smith at 10:00\"*\n4. 🟢 *\"Check my queue status\"*",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend) => {
    const messageText = textToSend || input;
    if (!messageText.trim()) return;

    if (!textToSend) setInput("");
    setMessages((prev) => [...prev, { role: "user", content: messageText }]);
    setIsLoading(true);

    try {
      const response = await api.post("/chat", {
        message: messageText,
        history: messages,
      });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.data.response },
      ]);
    } catch (err) {
      console.error("Chatbot API error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Sorry, I'm having trouble connecting to my brain right now. Please try again in a few moments!",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSend(suggestion);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 relative group animate-bounce"
        >
          <span className="text-2xl">🤖</span>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
          <div className="absolute right-16 bg-slate-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap shadow-md">
            Chat with MedFlow AI
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[360px] h-[500px] sm:w-[400px] bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden transition-all duration-500 ease-in-out transform scale-100 origin-bottom-right">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-4 text-white flex justify-between items-center shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl shadow-inner">
                🤖
              </div>
              <div>
                <h4 className="font-bold text-sm tracking-tight flex items-center gap-1.5">
                  MedFlow Assistant
                  <span className="text-[10px] bg-green-400 text-slate-950 font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                    Live
                  </span>
                </h4>
                <p className="text-[11px] text-white/80">Always ready to assist you</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white hover:bg-white/10 w-8 h-8 rounded-full flex items-center justify-center transition font-bold"
            >
              ✕
            </button>
          </div>

          {/* Messages Panel */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm leading-relaxed whitespace-pre-line ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-none"
                      : "bg-white text-slate-800 border border-slate-100 rounded-tl-none font-medium"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 flex gap-1.5 items-center shadow-sm">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div className="px-4 py-2 bg-slate-50/50 border-t border-slate-100 flex gap-2 overflow-x-auto scrollbar-none whitespace-nowrap">
            <button
              onClick={() => handleSuggestionClick("Show available doctors")}
              className="bg-white hover:bg-blue-50 text-blue-600 border border-blue-100 text-xs font-bold px-3 py-1.5 rounded-full transition shadow-sm flex-shrink-0"
            >
              🩺 Show Doctors
            </button>
            <button
              onClick={() => handleSuggestionClick("Show available slots")}
              className="bg-white hover:bg-blue-50 text-blue-600 border border-blue-100 text-xs font-bold px-3 py-1.5 rounded-full transition shadow-sm flex-shrink-0"
            >
              📅 Get Available Slots
            </button>
            <button
              onClick={() => handleSuggestionClick("Check my queue status")}
              className="bg-white hover:bg-blue-50 text-blue-600 border border-blue-100 text-xs font-bold px-3 py-1.5 rounded-full transition shadow-sm flex-shrink-0"
            >
              🟢 Queue Status
            </button>
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything (e.g. List doctors...)"
              className="flex-1 bg-slate-50 border border-slate-100 text-slate-800 placeholder-slate-400 text-sm px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl transition shadow-md active:scale-95 flex items-center justify-center"
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
