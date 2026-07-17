import { motion } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";

function Features() {
  const { t, locale } = useLanguage();

  const featuresList = [
    {
      icon: "🤖",
      title: locale === "te" ? "AI లక్షణాల విశ్లేషణ" : "AI Symptom Triage",
      description: t("how.step1_desc"),
      badge: locale === "te" ? "కస్టమ్ NLP ఇంజన్" : "Custom NLP Engine",
      badgeColor: "bg-blue-100 text-blue-700",
    },
    {
      icon: "⏱️",
      title: locale === "te" ? "లైవ్ క్యూ అంచనా" : "Live Queue Prediction",
      description: locale === "te" ? "మెషిన్ లెర్నింగ్ ఇంజన్ రోగులు వేచి ఉండే కాలాన్ని 94% ఖచ్చితత్వంతో లెక్కిస్తుంది." : "Proprietary wait-time predictor gives patients an exact ETA based on queue depth and consultation reason.",
      badge: locale === "te" ? "రియల్-టైమ్ AI" : "Real-Time AI",
      badgeColor: "bg-violet-100 text-violet-700",
    },
    {
      icon: "📲",
      title: locale === "te" ? "వాట్సాప్ రిమాండర్లు" : "WhatsApp Reminders",
      description: t("how.step3_desc"),
      badge: locale === "te" ? "బ్యాక్‌గ్రౌండ్ రన్" : "Background Daemon",
      badgeColor: "bg-green-100 text-green-700",
    },
    {
      icon: "🚗",
      title: locale === "te" ? "ప్రయాణ మార్గం & నో-షో AI" : "Commute-Aware No-Show AI",
      description: locale === "te" ? "రోగి ప్రయాణ విధానాన్ని (డ్రైవింగ్ / నడక) గమనించి వారి నో-షో ప్రమాదాన్ని అంచనా వేస్తుంది." : "Tracks patient travel mode (driving / transit / walking) and ETA to predict no-show risk dynamically.",
      badge: locale === "te" ? "ప్రత్యేక ఆవిష్కరణ" : "Unique in India",
      badgeColor: "bg-orange-100 text-orange-700",
    },
    {
      icon: "🎫",
      title: locale === "te" ? "కాంటాక్ట్‌లెస్ QR చెక్-ఇన్" : "Contactless QR Check-In",
      description: locale === "te" ? "రోగులు తమ డిజిటల్ టోకెన్ QR కోడ్‌ను రిసెప్షన్ వద్ద స్కాన్ చేసి వెంటనే చెక్-ఇన్ చేయవచ్చు." : "Patients scan a digital token QR code at reception. Admin webcam scanner confirms arrival instantly.",
      badge: locale === "te" ? "వెబ్‌క్యామ్ స్కానర్" : "Webcam Scanner",
      badgeColor: "bg-cyan-100 text-cyan-700",
    },
    {
      icon: "🔒",
      title: locale === "te" ? "సురక్షితమైన చెల్లింపులు" : "Secure Payments",
      description: locale === "te" ? "రేజర్‌పే గేట్‌వే ఇంటిగ్రేషన్ మరియు సర్వర్-సైడ్ HMAC సంతకం ధృవీకరణ." : "Razorpay integration with HMAC-SHA256 server-side signature verification for full checkout safety.",
      badge: locale === "te" ? "HMAC వెరిఫైడ్" : "HMAC Verified",
      badgeColor: "bg-red-100 text-red-700",
    },
  ];

  return (
    <section id="features" className="py-24 bg-white text-left">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block bg-blue-100 text-blue-700 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest mb-4">
            {t("features.tag")}
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
            {t("features.title")}
            <span className="text-blue-600">{t("features.heal")}</span>
          </h2>
          <p className="mt-4 text-slate-500 text-lg max-w-2xl mx-auto">
            {t("features.desc")}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuresList.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -4, shadow: "xl" }}
              className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col gap-4"
            >
              <div className="flex items-start justify-between">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl border border-slate-100">
                  {feature.icon}
                </div>
                <span
                  className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${feature.badgeColor}`}
                >
                  {feature.badge}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed font-semibold">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom tech stack row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-14 bg-slate-50 rounded-3xl border border-slate-100 p-6 text-center"
        >
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">
            {t("features.footer")}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "⚛️ React 19 + Vite",
              "🟩 Node.js + Express",
              "🐘 Supabase PostgreSQL",
              "🔐 JWT Auth",
              "🧪 Vitest Unit Tests",
              "🚀 Vercel + Render",
              "💳 Razorpay",
              "📱 Twilio WhatsApp",
              "🤖 GPT-4o-mini",
            ].map((tech) => (
              <span
                key={tech}
                className="bg-white border border-slate-200 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm"
              >
                {tech}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Features;