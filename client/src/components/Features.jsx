import { motion } from "framer-motion";

const features = [
  {
    icon: "🤖",
    title: "AI Symptom Triage",
    description:
      "NLP-powered engine maps patient symptoms to the right specialist — reducing misrouted appointments by matching keywords to medical specialties.",
    badge: "Custom NLP Engine",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    icon: "⏱️",
    title: "Live Queue Prediction",
    description:
      "Proprietary wait-time predictor gives patients an exact ETA (e.g. 24 ± 2 mins, 94% confidence) based on queue depth and consultation reason.",
    badge: "Real-Time AI",
    badgeColor: "bg-violet-100 text-violet-700",
  },
  {
    icon: "📲",
    title: "WhatsApp Reminders",
    description:
      "Autonomous daemon sends appointment reminders 30 minutes before every slot via Twilio — with zero human intervention required.",
    badge: "Background Daemon",
    badgeColor: "bg-green-100 text-green-700",
  },
  {
    icon: "🚗",
    title: "Commute-Aware No-Show AI",
    description:
      "Tracks patient travel mode (driving / transit / walking) and ETA. Predicts no-show risk and alerts the clinic before the patient is even marked absent.",
    badge: "Unique in India",
    badgeColor: "bg-orange-100 text-orange-700",
  },
  {
    icon: "🎫",
    title: "Contactless QR Check-In",
    description:
      "Patients scan a digital token QR code at reception. Admin webcam scanner confirms arrival and updates the live doctor queue instantly.",
    badge: "Webcam Scanner",
    badgeColor: "bg-cyan-100 text-cyan-700",
  },
  {
    icon: "🔒",
    title: "Secure Payments",
    description:
      "Razorpay integration with HMAC-SHA256 server-side signature verification. Payment status is confirmed before any queue token is issued.",
    badge: "HMAC Verified",
    badgeColor: "bg-red-100 text-red-700",
  },
];

function Features() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block bg-blue-100 text-blue-700 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest mb-4">
            Platform Features
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
            Built Different.
            <span className="text-blue-600"> Not Just Another Chatbot.</span>
          </h2>
          <p className="mt-4 text-slate-500 text-lg max-w-2xl mx-auto">
            3 custom AI engines, 2 background daemons, and a fully deployed
            production system — not a Figma mockup.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
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
                <p className="text-slate-500 text-sm leading-relaxed">
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
            Full-Stack Architecture
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