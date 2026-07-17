/**
 * Contact section — landing page.
 *
 * Desktop/Tablet (≥768px):
 *   Shows the embedded ChatPanel directly inline (no floating button).
 *
 * Mobile (<768px):
 *   Hides the embedded chat entirely — ChatWidget FAB handles it instead.
 *   Shows a simple "Open AI Chat" CTA button that triggers the FAB modal.
 *
 * Single source of truth: all state lives in ChatContext.
 */
import { useChat } from "../context/ChatContext";
import { useLanguage } from "../context/LanguageContext";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Sparkles, AlertTriangle, MessageSquare } from "lucide-react";
import ChatPanel from "./ChatPanel";

function Contact() {
  const { t, locale } = useLanguage();
  const { setIsOpen, config } = useChat();

  return (
    <section id="contact" className="py-24 bg-gradient-to-br from-blue-50 via-white to-cyan-50 font-sans text-left relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid md:grid-cols-5 gap-16 items-start">

        {/* ── Left column: contact info ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="md:col-span-2 space-y-8"
        >
          <div>
            <span className="text-blue-600 font-extrabold text-xs uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-full">
              {t("contact.tag")}
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight mt-4 leading-tight">
              {t("contact.title")} <span className="text-blue-600">{t("contact.support")}</span>
            </h2>
            <p className="text-slate-500 mt-4 leading-relaxed text-sm font-medium">
              {t("contact.desc")}
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4 items-center">
              <div className="w-11 h-11 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-blue-600 shrink-0">
                <Mail size={18} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{t("contact.email")}</p>
                <p className="text-sm font-bold text-slate-700 mt-0.5">support@medflow.ai</p>
              </div>
            </div>

            <div className="flex gap-4 items-center">
              <div className="w-11 h-11 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-blue-600 shrink-0">
                <Phone size={18} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{t("contact.phone")}</p>
                <p className="text-sm font-bold text-slate-700 mt-0.5">+91 98765 43210</p>
              </div>
            </div>

            <div className="flex gap-4 items-center">
              <div className="w-11 h-11 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-blue-600 shrink-0">
                <MapPin size={18} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{t("contact.hq")}</p>
                <p className="text-sm font-bold text-slate-700 mt-0.5">MG Road, Bangalore, India</p>
              </div>
            </div>
          </div>

          {/* Mobile CTA — only shown on screens <768px where embedded chat is hidden */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(true)}
              className={`w-full flex items-center justify-center gap-2.5 bg-gradient-to-r ${config.themeColor} text-white font-extrabold py-4 rounded-2xl shadow-xl text-sm transition active:scale-95 cursor-pointer`}
            >
              <MessageSquare size={18} />
              {locale === "te" ? "AI ఆరోగ్య సహాయకుడిని తెరవండి" : "Open AI Health Assistant"}
            </button>
            <p className="text-[10px] text-slate-400 font-semibold text-center mt-2">
              {locale === "te" ? "ట్యాప్ చేసి మీ AI తో మాట్లాడండి" : "Tap to chat with your AI assistant"}
            </p>
          </div>
        </motion.div>

        {/* ── Right column: embedded ChatPanel (desktop/tablet only) ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="md:col-span-3 hidden md:block"
        >
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden">
            {/* Card header */}
            <div className={`bg-gradient-to-r ${config.themeColor} px-6 py-4 flex items-center justify-between`}>
              <div className="flex items-center gap-3 text-white">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl shadow-inner">
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
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-amber-300 animate-pulse" />
                <span className="text-[10px] font-black text-white/80 uppercase tracking-wider">
                  {locale === "te" ? "AI శక్తితో" : "AI Powered"}
                </span>
              </div>
            </div>

            {/* Medical disclaimer strip */}
            <div className="flex items-start gap-2.5 bg-amber-50 border-b border-amber-100 px-5 py-3">
              <AlertTriangle size={13} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-700 font-semibold leading-relaxed">
                {locale === "te"
                  ? "గమనిక: ఈ AI ఆరోగ్య సహాయం కోసం మాత్రమే మరియు ఇది వైద్యుడి చికిత్సకు ప్రత్యామ్నాయం కాదు."
                  : "This AI provides healthcare assistance only and is not a substitute for professional medical advice."}
              </p>
            </div>

            {/* The single shared chat panel — fixed height so it doesn't push page */}
            <ChatPanel className="h-[480px]" />
          </div>
        </motion.div>

      </div>
    </section>
  );
}

export default Contact;
