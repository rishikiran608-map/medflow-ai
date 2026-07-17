/**
 * ChatPanel — The single, reusable chat UI component.
 * Renders the full conversation interface: messages, typing indicator,
 * suggestion chips, voice input, and send bar.
 *
 * Used by:
 *   • Contact.jsx (desktop/tablet: embedded inline)
 *   • ChatWidget.jsx (mobile: inside full-screen modal)
 *
 * All state is owned by ChatContext — no local state here.
 */
import { useEffect, useRef } from "react";
import { useChat } from "../context/ChatContext";
import { useLanguage } from "../context/LanguageContext";
import { Send, Mic, Sparkles, Bot } from "lucide-react";
import { motion } from "framer-motion";

// Renders a single message bubble
function MessageBubble({ msg, config }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className={`w-7 h-7 rounded-full bg-gradient-to-tr ${config.themeColor} flex items-center justify-center text-sm shrink-0 mr-2 mt-0.5 shadow-md`}>
          <span className="text-xs">{config.logo}</span>
        </div>
      )}
      <div
        className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-[13px] shadow-sm leading-relaxed whitespace-pre-line ${
          isUser
            ? `${config.accent} rounded-tr-none font-semibold`
            : "bg-white text-slate-800 border border-slate-100 rounded-tl-none font-medium"
        }`}
      >
        {msg.content}
      </div>
    </div>
  );
}

function ChatPanel({ showHeader = false, className = "" }) {
  const { locale, t } = useLanguage();
  const {
    messages,
    input,
    setInput,
    isLoading,
    isListening,
    handleVoiceInput,
    handleSend,
    config,
  } = useChat();

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const quickActions = locale === "te" ? [
    "నా ప్రిస్క్రిప్షన్లు చూపించు",
    "నేను ఏ మందులు వేసుకుంటున్నాను?",
    "నా క్యూ స్థితి తనిఖీ చేయి",
    "ఈరోజు అపాయింట్‌మెంట్ చూపించు",
    "నా రక్త నివేదికను వివరించు",
    "మందుల రిమైండర్లు",
    "డ్రగ్ ఇంటరాక్షన్ తనిఖీ",
  ] : [
    "Show my prescriptions",
    "What medicines am I taking?",
    "Check my queue status",
    "Show today's appointment",
    "Explain my blood report",
    "Medicine reminders",
    "Drug interaction check",
  ];

  return (
    <div className={`flex flex-col bg-white overflow-hidden ${className}`}>

      {/* Optional embedded header (used on mobile full-screen) */}
      {showHeader && (
        <div className={`bg-gradient-to-r ${config.themeColor} px-5 py-4 text-white flex items-center gap-3 shrink-0`}>
          <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-lg shadow-inner shrink-0">
            {config.logo}
          </div>
          <div>
            <p className="font-extrabold text-sm tracking-tight flex items-center gap-1.5">
              {config.agentName}
              <span className="text-[9px] bg-green-400 text-slate-950 font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                Live
              </span>
            </p>
            <p className="text-[10px] text-white/80 font-semibold">MedFlow OS Orchestration Layer</p>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/40 text-left min-h-0">
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} msg={msg} config={config} />
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className={`w-7 h-7 rounded-full bg-gradient-to-tr ${config.themeColor} flex items-center justify-center text-sm shrink-0 mr-2 mt-0.5`}>
              <span className="text-xs">{config.logo}</span>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 flex gap-1.5 items-center shadow-sm">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion chips */}
      <div className="px-3 py-2.5 bg-slate-50/60 border-t border-slate-100 flex gap-2 overflow-x-auto scrollbar-none whitespace-nowrap shrink-0">
        {quickActions.map((sug, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(sug)}
            className="bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 text-[10px] font-bold px-3 py-1.5 rounded-full transition shadow-sm flex-shrink-0 cursor-pointer"
          >
            {sug}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <div className="px-3 py-3 bg-white border-t border-slate-100 flex gap-2 items-center shrink-0">
        <button
          type="button"
          onClick={handleVoiceInput}
          title={isListening ? t("chat.stopSpeak") : t("chat.speak")}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition shrink-0 cursor-pointer ${
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
          placeholder={isListening ? t("chat.listening") : t("chat.askAI")}
          className={`flex-1 border text-slate-800 placeholder-slate-400 text-sm px-4 py-2.5 rounded-xl outline-none transition ${
            isListening
              ? "bg-red-50 border-red-300 focus:border-red-400"
              : "bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white"
          }`}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />

        <button
          onClick={() => handleSend()}
          disabled={isLoading || !input.trim()}
          className={`flex items-center gap-1.5 font-extrabold px-4 py-2.5 rounded-xl transition text-xs shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            isLoading
              ? "bg-slate-200 text-slate-400"
              : "bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white"
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t("chat.send")}</span>
        </button>
      </div>
    </div>
  );
}

export default ChatPanel;
