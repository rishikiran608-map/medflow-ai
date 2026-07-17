import { motion } from "framer-motion";

const steps = [
  {
    icon: "📅",
    step: "01",
    title: "Book Appointment",
    description:
      "Patient uses AI symptom triage to find the right specialist, then books a slot online in under 60 seconds.",
    color: "from-blue-500 to-blue-600",
    lightColor: "bg-blue-50 border-blue-100",
    textColor: "text-blue-600",
  },
  {
    icon: "💳",
    step: "02",
    title: "Secure Payment",
    description:
      "Pay consultation fee via Razorpay — HMAC-SHA256 verified on server side. Demo bypass available for presentations.",
    color: "from-violet-500 to-violet-600",
    lightColor: "bg-violet-50 border-violet-100",
    textColor: "text-violet-600",
  },
  {
    icon: "📍",
    step: "03",
    title: "Track & Get Alerts",
    description:
      "Live AI wait-time prediction updates every 20 seconds. Commute-aware engine monitors your ETA and triggers WhatsApp reminders 30 minutes before your slot.",
    color: "from-cyan-500 to-cyan-600",
    lightColor: "bg-cyan-50 border-cyan-100",
    textColor: "text-cyan-600",
  },
  {
    icon: "🎫",
    step: "04",
    title: "QR Check-In",
    description:
      "Arrive at clinic and scan your digital QR token. Admin webcam scanner instantly checks you in and alerts the doctor.",
    color: "from-emerald-500 to-emerald-600",
    lightColor: "bg-emerald-50 border-emerald-100",
    textColor: "text-emerald-600",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block bg-blue-100 text-blue-700 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest mb-4">
            How It Works
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
            From Booking to Consultation
            <span className="text-blue-600"> in 4 Steps</span>
          </h2>
          <p className="mt-4 text-slate-500 text-lg max-w-2xl mx-auto">
            MedFlow AI handles every step of the patient journey — with zero
            manual intervention from the clinic side.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connector line (desktop only) */}
          <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-blue-200 via-violet-200 via-cyan-200 to-emerald-200 z-0" />

          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className={`relative z-10 bg-white rounded-3xl p-6 border shadow-sm hover:shadow-xl transition-all duration-300 ${step.lightColor}`}
            >
              {/* Step number bubble */}
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${step.color} text-white flex items-center justify-center text-lg font-black shadow-lg mb-5`}
              >
                {step.icon}
              </div>

              <span
                className={`text-[10px] font-black uppercase tracking-widest ${step.textColor} block mb-2`}
              >
                Step {step.step}
              </span>

              <h3 className="text-lg font-extrabold text-slate-800 mb-3">
                {step.title}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-14 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl p-8 text-white text-center shadow-2xl shadow-blue-500/20"
        >
          <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-2">
            🤖 Running 24/7 With Zero Human Intervention
          </p>
          <h3 className="text-2xl md:text-3xl font-extrabold">
            Two Background AI Daemons Powering the Whole System
          </h3>
          <p className="mt-3 text-white/80 text-sm max-w-2xl mx-auto">
            A <strong>No-Show Detection Daemon</strong> runs every 25 seconds to
            auto-flag absent patients. A{" "}
            <strong>30-Minute Reminder Daemon</strong> sends WhatsApp alerts
            before every appointment — all autonomously.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <span className="bg-white/20 border border-white/30 text-white text-xs font-bold px-4 py-2 rounded-full">
              ⚡ No-Show Daemon: every 25s
            </span>
            <span className="bg-white/20 border border-white/30 text-white text-xs font-bold px-4 py-2 rounded-full">
              📲 WhatsApp Reminder: 30 min before
            </span>
            <span className="bg-white/20 border border-white/30 text-white text-xs font-bold px-4 py-2 rounded-full">
              🧠 3 Custom AI Engines
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default HowItWorks;
