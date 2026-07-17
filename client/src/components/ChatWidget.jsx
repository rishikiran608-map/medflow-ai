/**
 * ChatWidget — Mobile-only floating chatbot.
 *
 * Behavior:
 *  • Desktop/Tablet (≥768px): renders null — chatbot is embedded in Contact section
 *  • Mobile (<768px):         renders a FAB button + full-screen slide-up modal
 *
 * Single source of truth: all chat state lives in ChatContext.
 * ChatPanel is the reusable UI shared with the embedded desktop version.
 */
import { useEffect, useState } from "react";
import { useChat } from "../context/ChatContext";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ChatPanel from "./ChatPanel";

function ChatWidget() {
  const { isOpen, setIsOpen, config } = useChat();

  // Track whether we're on a mobile-sized screen
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Lock body scroll when modal is open on mobile
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMobile, isOpen]);

  // Desktop & tablet: no floating widget at all — embedded version handles it
  if (!isMobile) return null;

  return (
    <>
      {/* ── Mobile FAB button ── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            onClick={() => setIsOpen(true)}
            className={`fixed bottom-6 right-5 z-[90] w-14 h-14 bg-gradient-to-tr ${config.themeColor} rounded-full flex items-center justify-center text-white shadow-2xl cursor-pointer`}
            aria-label="Open AI Health Assistant"
          >
            <span className="text-2xl">{config.logo}</span>
            {/* Online dot */}
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
            {/* Ping ring */}
            <span className={`absolute inset-0 rounded-full ring-4 ring-blue-400/40 animate-ping pointer-events-none`} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Mobile full-screen modal ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-[95]"
              onClick={() => setIsOpen(false)}
            />

            {/* Chat sheet — slides up from bottom */}
            <motion.div
              key="sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-x-0 bottom-0 z-[96] flex flex-col rounded-t-3xl overflow-hidden shadow-2xl"
              style={{ height: "92dvh" }}
            >
              {/* Sheet header */}
              <div className={`bg-gradient-to-r ${config.themeColor} px-5 py-4 text-white flex items-center justify-between shrink-0`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-lg shadow-inner">
                    {config.logo}
                  </div>
                  <div>
                    <p className="font-extrabold text-sm flex items-center gap-1.5">
                      {config.agentName}
                      <span className="text-[9px] bg-green-400 text-slate-950 font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                        Live
                      </span>
                    </p>
                    <p className="text-[10px] text-white/80 font-semibold">MedFlow OS Orchestration Layer</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition cursor-pointer"
                  aria-label="Close chatbot"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Shared ChatPanel — same UI as desktop embedded version */}
              <ChatPanel className="flex-1 min-h-0" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default ChatWidget;
