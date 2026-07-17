import { useChat } from "../context/ChatContext";
import { useLanguage } from "../context/LanguageContext";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, Sparkles, AlertTriangle } from "lucide-react";

function Contact() {
  const { t, locale } = useLanguage();
  const {
    setIsOpen,
    input,
    setInput,
    handleSend,
    config
  } = useChat();

  const handleSuggestionClick = async (suggestion) => {
    setIsOpen(true);
    await handleSend(suggestion);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setIsOpen(true);
    handleSend();
  };

  // Specialty suggestion questions list
  const quickActions = locale === "te" ? [
    "నా ప్రిస్క్రిప్షన్లు చూపించు",
    "నేను ఏ మందులు వేసుకుంటున్నాను?",
    "నా క్యూ స్థితి తనిఖీ చేయి",
    "ఈరోజు అపాయింట్‌మెంట్ చూపించు",
    "నా రక్త నివేదికను వివరించు",
    "మందుల రిమైండర్లు",
    "డ్రగ్ ఇంటరాక్షన్ తనిఖీ",
    "వైద్యుడిని సంప్రదించండి"
  ] : [
    "Show my prescriptions",
    "What medicines am I taking?",
    "Check my queue status",
    "Show today's appointment",
    "Explain my blood report",
    "Medicine reminders",
    "Drug interaction check",
    "Contact my doctor"
  ];

  return (
    <section id="contact" className="py-24 bg-gradient-to-br from-blue-50 via-white to-cyan-50 font-sans text-left relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid md:grid-cols-5 gap-16 items-start">
        
        {/* Left: Contact Info (Col Span 2) */}
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
        </motion.div>

        {/* Right: Embedded Chatbot Card (Col Span 3) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="md:col-span-3 bg-white p-8 md:p-10 rounded-3xl border border-slate-100 shadow-xl space-y-6 text-left relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-2xl -z-10"></div>
          
          <div>
            <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2.5 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 w-fit">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              {locale === "te" ? "మెడ్‌ఫ్లో AI హెల్త్ అసిస్టెంట్" : "MedFlow AI Health Assistant"}
            </span>
            <h3 className="text-xl font-extrabold text-slate-800 mt-3.5">
              {locale === "te" ? "హలో 👋 నేను మీ మెడ్‌ఫ్లో AI ఆరోగ్య సహాయకుడిని." : "Hello 👋 I am your MedFlow AI Health Assistant."}
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              {locale === "te" ? "నేను మీకు వీటిలో సహాయపడగలను:" : "I can help you with:"}
            </p>
          </div>

          {/* List of assistant jobs */}
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-slate-600 pl-1 list-disc list-inside">
            <li>{locale === "te" ? "ప్రిస్క్రిప్షన్లు చూడండి" : "View prescriptions"}</li>
            <li>{locale === "te" ? "మందుల షెడ్యూల్స్" : "Medicine schedules"}</li>
            <li>{locale === "te" ? "అపాయింట్‌మెంట్ స్థితి" : "Appointment status"}</li>
            <li>{locale === "te" ? "క్యూ ట్రాకింగ్" : "Queue tracking"}</li>
            <li>{locale === "te" ? "ల్యాబ్ రిపోర్ట్ వివరణ" : "Lab report explanation"}</li>
            <li>{locale === "te" ? "వైద్య చరిత్ర" : "Medical history"}</li>
            <li>{locale === "te" ? "ఆరోగ్య సారాంశాలు" : "Health summaries"}</li>
            <li>{locale === "te" ? "డ్రగ్ ఇంటరాక్షన్ సమాచారం" : "Drug interaction info"}</li>
          </ul>

          <div className="bg-amber-50 border border-amber-100 text-amber-800 rounded-2xl p-4 flex gap-2.5 items-start">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-[10px] leading-relaxed font-bold">
              {locale === "te" 
                ? "గమనిక: ఈ AI ఆరోగ్య సహాయం కోసం మాత్రమే మరియు ఇది వైద్యుడి చికిత్సకు ప్రత్యామ్నాయం కాదు."
                : "Please note: This AI provides healthcare assistance only and is not a substitute for professional medical advice."}
            </p>
          </div>

          {/* Suggested Quick Actions */}
          <div className="space-y-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              {locale === "te" ? "సూచించిన ప్రశ్నలు" : "Suggested Queries"}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickActions.map((act) => (
                <button
                  key={act}
                  onClick={() => handleSuggestionClick(act)}
                  className="bg-slate-50 hover:bg-blue-50/50 text-slate-600 border border-slate-100 text-[10px] font-bold px-3 py-1.5 rounded-full transition shadow-sm cursor-pointer"
                >
                  {act}
                </button>
              ))}
            </div>
          </div>

          {/* Form Input */}
          <form onSubmit={handleSubmit} className="border-t border-slate-100 pt-5 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={locale === "te" ? "ఆరోగ్య సహాయకుడిని అడగండి..." : "Ask your health assistant..."}
              className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-blue-600 bg-slate-50 focus:bg-white font-semibold text-slate-800"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-3 rounded-xl text-xs transition shadow-md shadow-blue-500/10 cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Send size={12} />
              <span>{t("chat.send")}</span>
            </button>
          </form>
        </motion.div>

      </div>
    </section>
  );
}

export default Contact;
