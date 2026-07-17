import { motion } from "framer-motion";
import { ShieldCheck, Award, HeartHandshake, Zap } from "lucide-react";

function About() {
  const values = [
    {
      icon: <ShieldCheck size={28} className="text-blue-600" />,
      title: "Data Reliability",
      desc: "All healthcare profiles, queues, and appointments are stored with absolute consistency and end-to-end security."
    },
    {
      icon: <Award size={28} className="text-blue-600" />,
      title: "AI Patient Triage",
      desc: "Instant clinical analysis classifying patient urgency and directing them to correct medical specialists."
    },
    {
      icon: <HeartHandshake size={28} className="text-blue-600" />,
      title: "Patient Empathy",
      desc: "Eliminating waiting room anxiety by providing live progress queues, transparent ETAs, and traffic alerts."
    },
    {
      icon: <Zap size={28} className="text-blue-600" />,
      title: "Self-Healing System",
      desc: "Dynamically swaps and rebalances scheduling slots in real-time when no-shows or delays occur."
    }
  ];

  return (
    <section id="about" className="py-24 bg-white font-sans text-left relative overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-blue-400/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-400/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 grid md:grid-cols-2 gap-16 items-center">
        
        {/* Left: About Intro */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-blue-600 font-extrabold text-xs uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-full">
            Who We Are
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight mt-4 leading-tight">
            Pioneering the Next Generation of <span className="text-blue-600">Smart Care Delivery</span>
          </h2>
          <p className="text-slate-500 mt-6 leading-relaxed text-base font-medium">
            MedFlow AI was founded to bridge the gap between patient care and clinical operational efficiency. By leveraging traffic-aware commute tracking and smart queue scheduling, we eliminate waiting room bottlenecks to provide a stress-free experience for patients and save clinics millions of rupees in lost consulting hours.
          </p>
          <div className="mt-8 border-t border-slate-100 pt-8 grid grid-cols-2 gap-6">
            <div>
              <p className="text-3xl font-black text-blue-600">92%</p>
              <p className="text-xs text-slate-400 font-bold uppercase mt-1">Queue Accuracy</p>
            </div>
            <div>
              <p className="text-3xl font-black text-cyan-500">₹1.2L</p>
              <p className="text-xs text-slate-400 font-bold uppercase mt-1">Monthly Clinic Recovery</p>
            </div>
          </div>
        </motion.div>

        {/* Right: Core Values Grid */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid sm:grid-cols-2 gap-6"
        >
          {values.map((v, i) => (
            <div
              key={i}
              className="bg-slate-50 border border-slate-100/50 p-6 rounded-2xl shadow-sm hover:shadow-md transition duration-300 flex flex-col gap-4 text-left"
            >
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                {v.icon}
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">{v.title}</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed font-semibold">{v.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}

export default About;
