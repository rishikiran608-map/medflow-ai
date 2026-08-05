import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../api/api";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";
import { 
  Sparkles, ArrowRight, Play, CheckCircle2, ShieldCheck, 
  Zap, ScanLine, Bot, Activity, Users, ChevronRight, Cpu
} from "lucide-react";

function Hero() {
  const navigate = useNavigate();
  const { t, locale } = useLanguage();
  const [activeTab, setActiveTab] = useState("agent"); // 'agent', 'ocr', 'queue', 'noshow'
  const [loggingIn, setLoggingIn] = useState(false);

  const handleTryDemo = async (role = "Hospital Admin") => {
    setLoggingIn(true);
    toast.info(`🚀 Accessing Live ${role} Workspace...`);
    try {
      localStorage.setItem("token", "demo-jwt-token-12345");
      localStorage.setItem("userRole", role);
      localStorage.setItem("userName", `${role} Demo`);
      
      setTimeout(() => {
        if (role === "Doctor") navigate("/doctor-dashboard");
        else if (role === "Patient") navigate("/patient-dashboard");
        else navigate("/admin-dashboard");
      }, 500);
    } catch (err) {
      console.error(err);
      toast.error("Demo navigation error.");
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <section id="home" className="relative min-h-screen bg-slate-950 text-white font-sans overflow-hidden pt-12 pb-24 border-b border-slate-800/60">
      {/* Background Animated Gradient Mesh */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-blue-600/20 via-cyan-500/15 to-teal-500/10 rounded-full blur-[140px] opacity-70 animate-pulse"></div>
        <div className="absolute bottom-10 left-1/4 w-[400px] h-[300px] bg-indigo-600/15 rounded-full blur-[120px] opacity-50"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 space-y-16">
        
        {/* TOP ANNOUNCEMENT BADGE */}
        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            onClick={() => handleTryDemo("Hospital Admin")}
            className="group cursor-pointer inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 shadow-xl backdrop-blur-md transition-all duration-300"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              ✨ MedFlow Autonomous Agent Engine v2.5 Live
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </motion.div>
        </div>

        {/* HERO MAIN HEADER & ACTION BUTTONS */}
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.1] text-slate-100"
          >
            Skip the Waiting Room with{" "}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-300 bg-clip-text text-transparent">
              Autonomous AI Agents
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-base sm:text-xl text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed"
          >
            MedFlow AI orchestrates real-time patient queues, eliminates 84% of clinic no-shows with predictive automation, and empowers doctors with multimodal vision OCR.
          </motion.p>

          {/* CTA BUTTON GROUP */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <button
              onClick={() => handleTryDemo("Hospital Admin")}
              disabled={loggingIn}
              className="flex items-center gap-2.5 px-7 py-4 bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white rounded-2xl font-bold text-sm shadow-2xl shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <Zap className="w-4 h-4 text-cyan-200 fill-cyan-200 animate-bounce" />
              <span>{loggingIn ? "Launching Workspace..." : "Explore Live Admin Console"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleTryDemo("Doctor")}
              className="flex items-center gap-2 px-6 py-4 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 rounded-2xl font-bold text-sm shadow-xl transition-all duration-300"
            >
              <Bot className="w-4 h-4 text-teal-400" />
              <span>Launch Doctor Copilot</span>
            </button>

            <a
              href="/presentation.html"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-4 bg-slate-900/50 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-800/60 rounded-2xl font-medium text-sm transition"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Pitch Slides</span>
            </a>
          </motion.div>
        </div>

        {/* INTERACTIVE HERO DASHBOARD PREVIEW SANDBOX */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="bg-slate-900/90 border border-slate-800/90 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl"
        >
          {/* Preview Header & Feature Tabs */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800/80 gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 mr-3">
                <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
              </div>
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-300 tracking-wide font-mono">
                MedFlow AI Production Engine
              </span>
            </div>

            {/* Sandbox Tabs */}
            <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab("agent")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === "agent" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                🤖 Agentic Reasoning
              </button>
              <button
                onClick={() => setActiveTab("ocr")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === "ocr" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                🔍 Multimodal OCR
              </button>
              <button
                onClick={() => setActiveTab("noshow")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === "noshow" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                📊 No-Show Engine
              </button>
            </div>
          </div>

          {/* Tab Content Display */}
          <div className="p-6 md:p-8">
            <AnimatePresence mode="wait">
              {activeTab === "agent" && (
                <motion.div
                  key="agent"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4 font-mono text-xs text-left"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400">
                    <span>AGENT REASONING FEED</span>
                    <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                      n8n Webhook Connected
                    </span>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl space-y-2 border border-slate-800 text-slate-300">
                    <p className="text-slate-500">[19:42:05] 📥 Inbound Walk-in Triggered for Dr. Rajesh Kumar</p>
                    <p className="text-purple-300">[19:42:06] 🧠 Reasoning: Commute Delay + Weather (Rain + 1.8km traffic)...</p>
                    <p className="text-amber-300 font-semibold">[19:42:07] ⚠️ Predicted No-Show Risk: 84% (HIGH RISK)</p>
                    <p className="text-blue-300">[19:42:08] ⚡ Tool Action: Executed n8n Webhook -&gt; WhatsApp alert sent to patient.</p>
                    <p className="text-emerald-300">[19:42:09] ✅ Saved audit token #TK-8492 to Supabase database.</p>
                  </div>
                </motion.div>
              )}

              {activeTab === "ocr" && (
                <motion.div
                  key="ocr"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left"
                >
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Prescription Scan</span>
                      <span className="text-cyan-400 font-mono">Gemini 1.5 Vision</span>
                    </div>
                    <img
                      src="https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80"
                      alt="Prescription scan"
                      className="w-full h-32 object-cover rounded-xl border border-slate-800"
                    />
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                    <span className="text-emerald-400 font-bold text-[10px] uppercase tracking-wider block">
                      ✨ Extracted Schema
                    </span>
                    <p className="text-slate-300 font-bold">Patient: Rahul Sharma</p>
                    <p className="text-slate-400">Diagnosis: Essential Hypertension</p>
                    <div className="space-y-1 pt-2 border-t border-slate-900">
                      <div className="bg-slate-900 p-2 rounded border border-slate-800 flex justify-between">
                        <span className="text-slate-200">Amlodipine 5mg</span>
                        <span className="text-slate-500">Daily (Morning)</span>
                      </div>
                      <div className="bg-slate-900 p-2 rounded border border-slate-800 flex justify-between">
                        <span className="text-slate-200">Atorvastatin 20mg</span>
                        <span className="text-slate-500">Night</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "noshow" && (
                <motion.div
                  key="noshow"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4 text-left"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                      <span className="text-slate-500 font-medium block mb-1">Prevented No-Shows</span>
                      <p className="text-2xl font-black text-emerald-400">84%</p>
                      <span className="text-[10px] text-slate-500">Automated Rescheduling</span>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                      <span className="text-slate-500 font-medium block mb-1">Time Saved / Patient</span>
                      <p className="text-2xl font-black text-cyan-400">2+ Hours</p>
                      <span className="text-[10px] text-slate-500">Digital Token Queue</span>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                      <span className="text-slate-500 font-medium block mb-1">Recovered Revenue</span>
                      <p className="text-2xl font-black text-blue-400">₹1L / Month</p>
                      <span className="text-[10px] text-slate-500">Per Physician</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* TRUST SIGNALS & METRICS BAR */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-slate-900 text-slate-400 text-xs text-center font-medium">
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% HIPAA Compliant Architecture</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Vite 8.1 Ultra-Fast Execution</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>Gemini 1.5 & OpenAI RAG</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span>n8n Webhook Orchestration</span>
          </div>
        </div>

      </div>
    </section>
  );
}

export default Hero;