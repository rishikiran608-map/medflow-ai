import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Clipboard, RefreshCw, AlertCircle, Clock, Play, CheckSquare, 
  Smile, Phone, Activity, Sparkles, Send, ShieldAlert, Heart,
  ScanLine, ShieldCheck, FlaskConical, Eye, Stethoscope
} from "lucide-react";
import { toast } from "sonner";

function DoctorDashboard() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completing, setCompleting] = useState(false);
  const [callingNext, setCallingNext] = useState(false);
  const [selectedPatientHistory, setSelectedPatientHistory] = useState(null);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  // Form states
  const [diagnosis, setDiagnosis] = useState("");
  const [medsList, setMedsList] = useState([]);
  const [medName, setMedName] = useState("");
  const [medDosage, setMedDosage] = useState("");
  const [medFreq, setMedFreq] = useState("1 tablet • Daily");

  // Doctor AI Chat Assistant states
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", content: "🩺 Hello Doctor. I am your **Clinical Assistant**.\n\nI can retrieve treatment guidelines, compare lab reports, summarize EHR clinical histories, or auto-draft SOAP notes." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Active Patient computed states
  const activePatient = queue.find(item => item.queue_status === "In Consultation");
  const waitingQueue = queue.filter(item => item.queue_status !== "In Consultation");

  // Mock EHR/Briefing context for active patient
  const [briefing, setBriefing] = useState(null);

  const loadDoctorQueue = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const res = await api.get("/queue/doctor");
      setQueue(res.data);
      setError("");

      // Trigger pre-consult briefing computation if active patient exists
      const currentActive = res.data.find(item => item.queue_status === "In Consultation");
      if (currentActive) {
        setBriefing({
          complaints: "Mild chest discomfort on exertion, occasional palpitation for 2 days.",
          allergies: "Penicillin, Sulfa drugs",
          chronicDiseases: "Essential Hypertension (Stage 2), Hyperlipidemia",
          recentLab: "Lipid Panel (Atorvastatin compliance check): LDL 112 mg/dL (Slightly elevated)",
          aiBriefing: "⚠️ ALERT: Patient presents Stage 2 BP readings (140/90) and elevated LDL. Suggest reviewing Amlodipine dosage, checking Atorvastatin daily compliance, and scheduling a cardiovascular follow-up in 10 days."
        });
      } else {
        setBriefing(null);
      }
    } catch (err) {
      console.error("Error loading doctor queue:", err);
      setError("Failed to fetch queue list.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadDoctorQueue();
    const interval = setInterval(loadDoctorQueue, 20000);
    return () => clearInterval(interval);
  }, [loadDoctorQueue]);

  const handleAddMed = () => {
    if (!medName.trim() || !medDosage.trim()) {
      toast.warning("Please enter medicine name and dosage.");
      return;
    }
    setMedsList(prev => [...prev, { name: medName.trim(), dosage: `${medDosage.trim()} • ${medFreq}` }]);
    setMedName("");
    setMedDosage("");
    toast.success("Medicine added to prescription pad!");
  };

  const handleRemoveMed = (index) => {
    setMedsList(prev => prev.filter((_, i) => i !== index));
  };

  // AI SOAP Generator Action
  const triggerAutoDraftSOAP = () => {
    if (!activePatient) return;
    
    // Auto-fill Diagnosis input
    setDiagnosis("Essential Hypertension Stage-2, Mild Hyperlipidemia. Compliance checks required.");
    
    // Auto-fill Prescriptions list (AI assists, Doctor reviews & approves)
    setMedsList([
      { name: "Amlodipine 5mg", dosage: "1 tablet • 1 tablet • Daily (Morning)" },
      { name: "Atorvastatin 10mg", dosage: "1 tablet • 1 tablet • Night (Daily)" }
    ]);
    
    toast.success("✨ AI SOAP Notes and Prescription suggestions drafted. Please verify and edit before submitting!");
  };

  const handleCallNext = async () => {
    setCallingNext(true);
    try {
      const res = await api.put("/queue/call-next");
      if (res.data.success) {
        await loadDoctorQueue();
        toast.success("Called next patient!");
      }
    } catch (err) {
      console.error(err);
      toast.warning("No patients checked-in and ready to consult.");
    } finally {
      setCallingNext(false);
    }
  };

  const handleComplete = async (queueId) => {
    setCompleting(true);
    try {
      await api.put(`/queue/complete/${queueId}`, {
        prescription: medsList,
        diagnosis: diagnosis || "General Checkup"
      });
      toast.success("Consultation completed successfully!");
      setMedsList([]);
      setDiagnosis("");
      setBriefing(null);
      await loadDoctorQueue();
    } catch (err) {
      console.error(err);
      toast.error("Failed to complete session.");
    } finally {
      setCompleting(false);
    }
  };

  // Chat with Doctor Clinical Assistant
  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const msg = chatInput;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: msg }]);
    setChatLoading(true);

    try {
      const res = await api.post("/orchestrate/chat", {
        message: msg,
        conversationId: "doctor-workspace-chat"
      });

      if (res.data.success) {
        setChatMessages(prev => [...prev, { role: "assistant", content: res.data.response }]);
      }
    } catch (err) {
      console.error(err);
      toast.error("AI Assistant error.");
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 sm:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Title */}
        <div className="flex items-center gap-3">
          <span className="text-3xl">🩺</span>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Clinical Doctor Panel</h1>
            <p className="text-slate-500 text-sm font-medium">Manage queue check-ins, prepare patient summaries, and finalize SOAP prescriptions.</p>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT & CENTER columns */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Consultation Preparation Briefing (Visible when consulting) */}
            {activePatient && briefing && (
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md space-y-4 text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-teal-50 rounded-full blur-3xl -z-10"></div>
                <h3 className="text-sm font-black text-teal-600 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  AI Pre-Consultation Preparation Briefing
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">Recent Complaints</span>
                    <p>{briefing.complaints}</p>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">Chronic Diseases</span>
                    <p>{briefing.chronicDiseases}</p>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">Allergies flagged</span>
                    <p className="text-red-600 font-extrabold">{briefing.allergies}</p>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">Recent Lab / Scans</span>
                    <p>{briefing.recentLab}</p>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 text-amber-800 rounded-2xl p-4 text-xs leading-relaxed font-semibold">
                  {briefing.aiBriefing}
                </div>
              </div>
            )}

            {/* ─── Patient AI Symptom Summary (from BookAppointment) ─── */}
            {activePatient && (() => {
              let parsedSummary = null;
              try {
                // notes field stores JSON with aiSummary from BookAppointment
                const notesRaw = activePatient.appointments?.notes || activePatient.notes || "{}";
                const parsed = JSON.parse(notesRaw);
                if (parsed?.aiSummary && parsed.aiSummary.primaryComplaint) {
                  parsedSummary = parsed;
                }
              } catch (_) {}
              if (!parsedSummary) return null;
              const s = parsedSummary.aiSummary;
              const severityColor = s.severity === "Severe" ? "text-red-600" : s.severity === "Moderate" ? "text-amber-600" : "text-green-600";
              const urgentBg = s.urgencyLevel?.toLowerCase().includes("urgent") ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200";
              return (
                <div className="bg-white rounded-3xl border border-indigo-100 shadow-md overflow-hidden text-left">
                  <div className="bg-gradient-to-r from-indigo-600 to-blue-500 px-6 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-white">
                      <ScanLine size={15} />
                      <p className="font-black text-sm">Patient AI Symptom Summary</p>
                      <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Pre-Visit Report</span>
                    </div>
                    <div className="text-white/80 text-[10px] font-bold">
                      Confidence: {s.confidenceScore || 85}%
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Primary complaint */}
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Primary Complaint</p>
                      <p className="text-sm font-semibold text-slate-700 leading-relaxed">{s.primaryComplaint}</p>
                    </div>

                    {/* Visible Findings */}
                    {s.visibleFindings && (
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Visible Findings (AI Camera Analysis)</p>
                        <p className="text-sm font-semibold text-slate-600 leading-relaxed">{s.visibleFindings}</p>
                      </div>
                    )}

                    {/* Chips row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Duration</p>
                        <p className="text-xs font-extrabold text-slate-700">{s.duration || "—"}</p>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Severity</p>
                        <p className={`text-xs font-extrabold ${severityColor}`}>{s.severity}</p>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Suggested Dept.</p>
                        <p className="text-xs font-extrabold text-indigo-600">{s.suggestedDepartment}</p>
                      </div>
                      <div className={`border rounded-xl p-3 ${urgentBg}`}>
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Urgency</p>
                        <p className="text-xs font-extrabold text-slate-700">{s.urgencyLevel}</p>
                      </div>
                    </div>

                    {/* Symptoms list */}
                    {(s.symptomsMentioned || []).length > 0 && (
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Symptoms Reported by Patient</p>
                        <div className="flex flex-wrap gap-1.5">
                          {s.symptomsMentioned.map((sym, i) => (
                            <span key={i} className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold px-2.5 py-1 rounded-full">
                              {sym}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Notes */}
                    {s.additionalNotes && (
                      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3.5 flex gap-2.5">
                        <ShieldCheck size={14} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[9px] font-black text-amber-800 uppercase mb-0.5">AI Notes for Doctor</p>
                          <p className="text-xs text-amber-700 font-semibold leading-relaxed">{s.additionalNotes}</p>
                        </div>
                      </div>
                    )}

                    {/* Original Patient Text */}
                    {parsedSummary.symptomText && (
                      <div className="border-t border-slate-100 pt-3.5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Original Patient Description</p>
                        <p className="text-xs text-slate-500 font-semibold italic leading-relaxed">"{parsedSummary.symptomText}"</p>
                      </div>
                    )}

                    <div className="text-[9px] text-slate-400 font-bold border-t border-slate-100 pt-2">
                      ⚠ AI-generated pre-visit summary only — not a clinical diagnosis. Verified by doctor before treatment.
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Active Consultation Panel */}
            {activePatient ? (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-md text-left relative">
                <div className="flex justify-between items-start border-b border-slate-100 pb-5 mb-5">
                  <div>
                    <span className="bg-teal-50 text-teal-800 text-[10px] font-extrabold px-3 py-1.5 rounded-full border border-teal-100 uppercase tracking-wider">
                      Consulting In Progress
                    </span>
                    <h2 className="text-2xl font-black text-slate-800 mt-3">{activePatient.patients?.full_name}</h2>
                    <p className="text-slate-400 text-xs font-bold uppercase mt-1">Age: {activePatient.patients?.age || 25} yrs • Gender: {activePatient.patients?.gender || "Male"}</p>
                  </div>
                  
                  <button
                    onClick={triggerAutoDraftSOAP}
                    className="bg-slate-900 text-white font-extrabold px-4 py-2.5 rounded-xl hover:bg-slate-800 transition text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    <Sparkles size={14} className="text-amber-400" />
                    Auto-Draft SOAP & Rx
                  </button>
                </div>

                {/* Diagnosis and prescription paddings */}
                <div className="space-y-5">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">Diagnosis Summary</label>
                    <input
                      type="text"
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      placeholder="e.g. Acute Cardiac Strain check, Hypertension Stage 2..."
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 bg-white font-semibold text-slate-800"
                    />
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-semibold">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">Add Medicine</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input 
                        type="text" 
                        placeholder="Medicine Name" 
                        value={medName} 
                        onChange={(e) => setMedName(e.target.value)}
                        className="border border-slate-200 rounded-xl p-2.5 text-xs bg-white"
                      />
                      <input 
                        type="text" 
                        placeholder="Dosage (e.g. 5mg)" 
                        value={medDosage} 
                        onChange={(e) => setMedDosage(e.target.value)}
                        className="border border-slate-200 rounded-xl p-2.5 text-xs bg-white"
                      />
                      <select 
                        value={medFreq} 
                        onChange={(e) => setMedFreq(e.target.value)}
                        className="border border-slate-200 rounded-xl p-2.5 text-xs bg-white font-bold"
                      >
                        <option value="1 tablet • Daily (Morning)">1 tablet • Daily (Morning)</option>
                        <option value="1 tablet • Daily (Night)">1 tablet • Daily (Night)</option>
                        <option value="1 tablet • Twice Daily">1 tablet • Twice Daily</option>
                        <option value="1 capsule • Before food">1 capsule • Before food</option>
                      </select>
                    </div>
                    <button 
                      onClick={handleAddMed}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 rounded-xl mt-3 text-xs transition"
                    >
                      Add Medication to Rx Pad
                    </button>
                  </div>

                  {medsList.length > 0 && (
                    <div className="space-y-2 border-t border-slate-100 pt-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Rx Medication Pad Checklist</h4>
                      {medsList.map((m, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs">
                          <div>
                            <span className="font-bold text-slate-800">{m.name}</span>
                            <span className="text-slate-400 ml-2 font-medium">({m.dosage})</span>
                          </div>
                          <button onClick={() => handleRemoveMed(idx)} className="text-red-500 font-black">✕</button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 border-t border-slate-100 pt-5 mt-5">
                    <button
                      onClick={() => handleComplete(activePatient.id)}
                      disabled={completing}
                      className="bg-green-600 hover:bg-green-700 text-white font-black px-6 py-3.5 rounded-xl transition text-xs shadow-lg shadow-green-500/10 flex items-center gap-2"
                    >
                      <CheckSquare size={14} />
                      {completing ? "Submitting Summary..." : "Complete Consultation & Log Rx"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-slate-100 py-20 flex flex-col items-center">
                <Smile className="w-16 h-16 text-slate-300 mb-4 animate-bounce" />
                <h3 className="text-2xl font-black text-slate-800">No Patient In Chamber</h3>
                <p className="text-slate-400 text-xs mt-1 max-w-sm">Use the buttons to call the next checked-in patient from the wait queue line.</p>
                <button
                  onClick={handleCallNext}
                  disabled={callingNext || waitingQueue.length === 0}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-black px-6 py-3.5 rounded-xl transition text-xs mt-6 flex items-center gap-2"
                >
                  <Play size={14} /> Call Next Patient
                </button>
              </div>
            )}

          </div>

          {/* RIGHT column (Queue waitlist + AI assistant) */}
          <div className="space-y-8">
            
            {/* Queue Timeline Panel */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm text-left">
              <h3 className="font-extrabold text-slate-800 text-sm mb-4">Patient Waiting Queue ({waitingQueue.length})</h3>
              
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {waitingQueue.map((item, idx) => (
                  <div key={item.id} className="flex justify-between items-center p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold">
                    <div>
                      <p className="font-bold text-slate-800">#{item.token_number} - {item.patients?.full_name}</p>
                      <span className="text-[10px] text-slate-400 block mt-1">{item.queue_status}</span>
                    </div>
                    {item.no_show_risk === "High" && (
                      <span className="text-[9px] bg-red-50 text-red-600 font-extrabold px-2 py-0.5 rounded-full border border-red-100 animate-pulse">
                        No-Show Risk
                      </span>
                    )}
                  </div>
                ))}
                {waitingQueue.length === 0 && (
                  <p className="text-slate-400 text-xs py-4 text-center">Empty wait list.</p>
                )}
              </div>
            </div>

            {/* Doctor Assistant Chat widget */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-md flex flex-col h-[400px] overflow-hidden text-left">
              <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-4 text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl shadow-inner animate-pulse">
                  🩺
                </div>
                <div>
                  <h3 className="font-extrabold text-sm">Clinical Assistant</h3>
                  <p className="text-[10px] text-white/80">MedFlow OS Agent Orchestrator</p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-sm leading-relaxed whitespace-pre-line ${
                      msg.role === "user" 
                        ? "bg-teal-600 text-white rounded-tr-none" 
                        : "bg-white text-slate-800 border border-slate-100 rounded-tl-none font-medium"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-100 rounded-2xl px-4 py-2 text-xs flex gap-1.5 items-center">
                      <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" />
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-3 border-t border-slate-100 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Query guidelines or SOPs..."
                  className="flex-1 border border-slate-100 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-teal-600 bg-slate-50/50"
                  onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                />
                <button
                  onClick={handleSendChat}
                  className="bg-teal-600 hover:bg-teal-700 text-white p-2.5 rounded-xl transition flex items-center justify-center shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default DoctorDashboard;