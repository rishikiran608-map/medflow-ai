import { useState } from "react";
import { TrendingUp, Users, Activity, Heart, ArrowUpRight, CheckCircle, MessageSquare, Send } from "lucide-react";
import api from "../api/api";
import { toast } from "sonner";
import { DEMO_CLINIC_KPIS, DEMO_DOCTORS } from "../data/demoData";
import { useLanguage } from "../context/LanguageContext";

function ClinicOwnerDashboard() {
  const { t, locale } = useLanguage();
  const [aiForecastActive, setAiForecastActive] = useState(false);
  // Chat state
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", content: "💼 Welcome back, Director. I am your **Clinic Owner Assistant**.\n\nI can analyze your clinical performance, track revenue trends, monitor doctor utilization rates, and review AI adoption stats." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Business Analytics — Live demo KPIs
  const businessKpis = DEMO_CLINIC_KPIS;

  const doctorPerformance = [
    { name: "Dr. Rajesh Kumar", specialty: "Cardiology",       utilization: "88%", revenue: "₹92,000", status: "Optimal",   patients: 368 },
    { name: "Dr. Sarah Patel",  specialty: "Pediatrics",       utilization: "72%", revenue: "₹65,000", status: "Optimal",   patients: 295 },
    { name: "Dr. Amit Sharma",  specialty: "Orthopedics",      utilization: "82%", revenue: "₹88,000", status: "Optimal",   patients: 314 },
    { name: "Dr. Emily Watson", specialty: "Dermatology",      utilization: "64%", revenue: "₹51,000", status: "Moderate",  patients: 212 },
    { name: "Dr. Vikram Iyer",  specialty: "General Medicine", utilization: "94%", revenue: "₹29,000", status: "High Load", patients: 145 },
    { name: "Dr. Priya Nair",   specialty: "Gynecology",       utilization: "76%", revenue: "₹55,500", status: "Optimal",   patients: 213 },
  ];

  // AI Chat Handler
  const handleSendChat = async (textToSend) => {
    const msg = typeof textToSend === "string" ? textToSend : chatInput;
    if (!msg.trim()) return;
    if (typeof textToSend !== "string") setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: msg }]);
    setChatLoading(true);

    try {
      const res = await api.post("/orchestrate/chat", {
        message: msg,
        conversationId: "owner-assistant-chat",
        language: locale || "en"
      });

      if (res.data.success) {
        setChatMessages(prev => [
          ...prev, 
          { 
            role: "assistant", 
            content: res.data.response,
            citations: res.data.citations
          }
        ]);
      }
    } catch (err) {
      console.error(err);
      toast.error("AI error. Please try again.");
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 sm:p-10 font-sans grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* LEFT & CENTER: Business KPIs */}
      <div className="lg:col-span-2 space-y-8">
        
        {/* Header Title */}
        <div className="flex items-center gap-3">
          <span className="text-3xl">💼</span>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">{t("owner.title")}</h1>
            <p className="text-slate-500 text-sm font-medium">{t("owner.sub")}</p>
          </div>
        </div>

        {/* 1. AI Forecast Alert Banner */}
        {aiForecastActive && (
          <div className="mb-6 bg-gradient-to-r from-amber-500 to-rose-500 rounded-3xl p-5 text-white shadow-xl shadow-amber-500/20 animate-pulse border border-amber-400">
            <h4 className="font-extrabold text-sm flex items-center gap-2">
              <span>✨</span>
              <span>AI Performance Forecast Applied (Active Control Loop)</span>
            </h4>
            <p className="text-[11px] text-white/90 font-medium mt-1">
              Simulating 15% booking backfill rate, optimized doctor scheduling, and reduced no-show operational leaks.
            </p>
          </div>
        )}

        {/* 1. KPIs Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Revenue */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">{t("owner.revenue")}</span>
              <span className="p-2 bg-green-50 text-green-600 rounded-xl"><TrendingUp size={16} /></span>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">
                {aiForecastActive ? "₹4,00,775" : businessKpis.revenue}
              </h3>
              <div className="flex items-center gap-1 text-xs font-bold text-green-600 mt-1">
                <ArrowUpRight size={14} />
                <span>{aiForecastActive ? "+23.5%" : businessKpis.revenueChange} vs last month</span>
              </div>
            </div>
          </div>

          {/* Retention */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">{t("owner.retention")}</span>
              <span className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Users size={16} /></span>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">
                {aiForecastActive ? "91%" : businessKpis.retention}
              </h3>
              <div className="flex items-center gap-1 text-xs font-bold text-green-600 mt-1">
                <ArrowUpRight size={14} />
                <span>{aiForecastActive ? "+6.2%" : businessKpis.retentionChange} vs last month</span>
              </div>
            </div>
          </div>

          {/* Utilization */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Doctor Utilization</span>
              <span className="p-2 bg-purple-50 text-purple-600 rounded-xl"><Activity size={16} /></span>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">
                {aiForecastActive ? "86%" : businessKpis.utilization}
              </h3>
              <div className="flex items-center gap-1 text-xs font-bold text-green-600 mt-1">
                <ArrowUpRight size={14} />
                <span>{aiForecastActive ? "+8.0%" : businessKpis.utilizationChange} vs last month</span>
              </div>
            </div>
          </div>

          {/* AI Adoption */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">AI Adoption Accuracy</span>
              <span className="p-2 bg-rose-50 text-rose-600 rounded-xl"><CheckCircle size={16} /></span>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">
                {aiForecastActive ? "98%" : businessKpis.aiAdoption}
              </h3>
              <div className="flex items-center gap-1 text-xs font-bold text-green-600 mt-1">
                <ArrowUpRight size={14} />
                <span>{aiForecastActive ? "+6.0%" : businessKpis.aiAdoptionChange} vs last month</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Doctor Utilization details */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm">
          <h2 className="text-xl font-extrabold text-slate-800 mb-5">Department Utilization & Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-extrabold text-xs uppercase">
                  <th className="pb-3">Doctor</th>
                  <th className="pb-3">Specialty</th>
                  <th className="pb-3">Utilization</th>
                  <th className="pb-3">Billing Contribution</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                {doctorPerformance.map((doc, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3.5 font-bold text-slate-800">{doc.name}</td>
                    <td className="py-3.5">{doc.specialty}</td>
                    <td className="py-3.5">{doc.utilization}</td>
                    <td className="py-3.5">{doc.revenue}</td>
                    <td className="py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        doc.status === "High Load" 
                          ? "bg-red-50 text-red-600 border border-red-100" 
                          : doc.status === "Moderate"
                            ? "bg-amber-50 text-amber-600 border border-amber-100"
                            : "bg-green-50 text-green-600 border border-green-100"
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* RIGHT SIDE: Owner AI Chat Assistant */}
      <div className="bg-white rounded-3xl border-2 border-rose-500 shadow-xl shadow-rose-500/10 flex flex-col h-[650px] overflow-hidden ring-4 ring-rose-500/10 transition-all duration-300 hover:shadow-rose-500/20 hover:border-rose-600">
        {/* Assistant Header */}
        <div className="bg-gradient-to-r from-rose-500 to-pink-500 p-4 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl shadow-inner animate-pulse">
              💼
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm">Owner Assistant</h3>
                <span className="text-[9px] bg-amber-400 text-slate-900 font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-0.5 shadow-sm">
                  ✨ AGENTIC ANALYTICS RAG ACTIVE
                </span>
              </div>
              <p className="text-[9px] text-white/90 font-semibold tracking-wide">Business Metrics Vector Feed & GPT-4o</p>
            </div>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <span className="flex items-center gap-1 text-[8px] font-black uppercase text-green-300">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping" />
              Connected
            </span>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {chatMessages.map((msg, idx) => {
            const isUser = msg.role === "user";
            return (
              <div key={idx} className={`flex flex-col ${isUser ? "items-end" : "items-start"} gap-1`}>
                <div className="flex items-start">
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-sm leading-relaxed whitespace-pre-line ${
                    isUser 
                      ? "bg-rose-600 text-white rounded-tr-none font-semibold" 
                      : "bg-white text-slate-800 border border-slate-100 rounded-tl-none font-medium"
                  }`}>
                    {msg.content}
                  </div>
                </div>
                {!isUser && msg.citations && msg.citations.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-0.5 max-w-[85%]">
                    {msg.citations.map((cite, cIdx) => (
                      <div
                        key={cIdx}
                        className="inline-flex items-center gap-1 bg-rose-50/50 text-rose-600 border border-rose-100 rounded-full px-2 py-0.5 text-[9px] font-black tracking-wide"
                      >
                        <span>📖</span>
                        <span className="truncate max-w-[120px]">{cite.title}</span>
                        <span className="opacity-75">({Math.round(cite.confidence * 100)}%)</span>
                      </div>
                    ))}
                  </div>
                )}
                {!isUser && (() => {
                  const contentLower = msg.content.toLowerCase();
                  const actions = [];
                  
                  if (contentLower.includes("kpi") || contentLower.includes("utilization") || contentLower.includes("revenue") || contentLower.includes("performance") || contentLower.includes("clinic")) {
                    if (!aiForecastActive) {
                      actions.push({
                        label: "📈 Apply AI Performance Forecast",
                        onClick: () => {
                          setAiForecastActive(true);
                          toast.success("AI predictive growth model applied to KPIs!");
                        }
                      });
                    } else {
                      actions.push({
                        label: "🔄 Revert to Standard View",
                        onClick: () => {
                          setAiForecastActive(false);
                          toast.success("Returned to actual clinic records.");
                        }
                      });
                    }
                  }

                  if (actions.length === 0) return null;
                  return (
                    <div className="flex flex-wrap gap-1.5 mt-2 bg-rose-50/30 p-1.5 border border-dashed border-rose-200 rounded-xl max-w-[85%]">
                      {actions.map((act, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={act.onClick}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-2 py-1 rounded-lg text-[9px] uppercase tracking-wide transition active:scale-95 cursor-pointer shadow-sm shadow-rose-600/10"
                        >
                          {act.label}
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>
            );
          })}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-100 rounded-2xl px-4 py-2 text-xs flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce" />
              </div>
            </div>
          )}
        </div>

        {/* Suggested Quick RAG Queries */}
        <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex gap-1.5 overflow-x-auto scrollbar-none whitespace-nowrap shrink-0">
          {(locale === "te"
            ? ["క్లినిక్ బిజినెస్ KPIs", "వైద్యుల వినియోగ స్థాయిలు", "AI ఆప్టిమైజేషన్ ప్రభావం"]
            : ["Summarize clinic business KPIs", "Show doctor utilization levels", "AI optimization impact", "Late cancellation rules"]
          ).map((sug, idx) => (
            <button
              key={idx}
              onClick={() => handleSendChat(sug)}
              className="bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 text-[10px] font-bold px-2.5 py-1.5 rounded-full transition shadow-sm cursor-pointer flex-shrink-0"
            >
              {sug}
            </button>
          ))}
        </div>

        {/* Chat Input */}
        <div className="p-3 border-t border-slate-100 flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask AI Owner Agent..."
            className="flex-1 border border-slate-100 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-rose-500 bg-slate-50/50"
            onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
          />
          <button
            onClick={handleSendChat}
            className="bg-rose-500 hover:bg-rose-600 text-white p-2.5 rounded-xl transition flex items-center justify-center shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}

export default ClinicOwnerDashboard;
