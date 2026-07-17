import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, HelpCircle } from "lucide-react";
import { toast } from "sonner";

function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.warning("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      toast.success("Message sent successfully! Our team will get back to you shortly.");
      setFormData({ name: "", email: "", subject: "", message: "" });
      setLoading(false);
    }, 1500);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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
              Get In Touch
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight mt-4 leading-tight">
              Connect With <span className="text-blue-600">MedFlow Support</span>
            </h2>
            <p className="text-slate-500 mt-4 leading-relaxed text-sm font-medium">
              Have questions about integrating MedFlow AI with your existing EHR system? Reach out and our engineering support team will assist you.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4 items-center">
              <div className="w-11 h-11 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-blue-600 shrink-0">
                <Mail size={18} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Email Support</p>
                <p className="text-sm font-bold text-slate-700 mt-0.5">support@medflow.ai</p>
              </div>
            </div>

            <div className="flex gap-4 items-center">
              <div className="w-11 h-11 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-blue-600 shrink-0">
                <Phone size={18} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Call Reception</p>
                <p className="text-sm font-bold text-slate-700 mt-0.5">+91 98765 43210</p>
              </div>
            </div>

            <div className="flex gap-4 items-center">
              <div className="w-11 h-11 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-blue-600 shrink-0">
                <MapPin size={18} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Clinic Headquarters</p>
                <p className="text-sm font-bold text-slate-700 mt-0.5">MG Road, Bangalore, India</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right: Contact Form (Col Span 3) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="md:col-span-3 bg-white p-8 md:p-10 rounded-3xl border border-slate-100 shadow-xl"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1.5">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 focus:bg-white transition"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1.5">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="rahul@example.com"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 focus:bg-white transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1.5">Subject</label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="How can we help you?"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1.5">Message *</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                placeholder="Type your query here..."
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 focus:bg-white transition resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-xl text-xs transition shadow-md shadow-blue-500/10 disabled:opacity-50"
            >
              <Send size={14} />
              <span>{loading ? "Sending Message..." : "Send Message"}</span>
            </button>
          </form>
        </motion.div>

      </div>
    </section>
  );
}

export default Contact;
