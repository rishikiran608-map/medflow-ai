import { useEffect, useRef } from "react";
import { useChat } from "../context/ChatContext";
import { useLanguage } from "../context/LanguageContext";
import { Send, Mic, Sparkles } from "lucide-react";

function ChatWidget() {
  const { locale, t } = useLanguage();
  const {
    isOpen,
    setIsOpen,
    messages,
    input,
    setInput,
    isLoading,
    isListening,
    handleVoiceInput,
    handleSend,
    config
  } = useChat();

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isLoading, isOpen]);

  return (
    <div className="fixed bottom-6 right-6 z-[90] font-sans">
      {/* FAB Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`w-14 h-14 bg-gradient-to-tr ${config.themeColor} rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 relative group cursor-pointer`}
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
              className="text-white/70 hover:text-white hover:bg-white/10 w-8 h-8 rounded-full flex items-center justify-center transition font-bold cursor-pointer"
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
                className="bg-white hover:bg-blue-50/50 text-slate-600 border border-slate-200 text-[10px] font-bold px-3 py-1.5 rounded-full transition shadow-sm flex-shrink-0 cursor-pointer"
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center">
            <button
              type="button"
              onClick={handleVoiceInput}
              title={isListening ? t("chat.stopSpeak") : t("chat.speak")}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition shrink-0 cursor-pointer ${
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
              className={`flex-1 border text-slate-800 placeholder-slate-400 text-xs px-4 py-2.5 rounded-xl outline-none transition ${
                isListening
                  ? "bg-red-50 border-red-300 focus:border-red-400"
                  : "bg-slate-50 border-slate-100 focus:border-blue-500 focus:bg-white"
              }`}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            
            <button
              onClick={() => handleSend()}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl transition text-xs shadow-md active:scale-95 cursor-pointer"
            >
              {t("chat.send")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatWidget;
