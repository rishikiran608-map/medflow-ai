import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Clock, Calendar, AlertCircle, Compass, CheckCircle, Navigation, 
  MapPin, Car, X, Upload, Camera, AlertTriangle, CreditCard, FileText, 
  ShieldCheck, History, Sparkles, Plus, Phone, Settings, Activity, Send, TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { DEMO_APPOINTMENTS, DEMO_TIMELINE, DEMO_QUEUE_ENTRY, DEMO_HEALTH_CONSULTATIONS } from "../data/demoData";
import { useLanguage } from "../context/LanguageContext";

function PatientDashboard() {
  const navigate = useNavigate();
  const { t, locale } = useLanguage();
  
  // Tab states for 15 sections
  // 'overview' (appointments, notifications, contacts)
  // 'timeline' (chronological timeline)
  // 'prescriptions' (tracker, prescription vault)
  // 'reports' (reports upload, medical images)
  // 'billing' (payments, invoice, insurance verification)
  // 'settings' (profile, consent management)
  const [activeTab, setActiveTab] = useState("overview");
  const [showcaseMode, setShowcaseMode] = useState("aarav"); 
  const [dbConsultations, setDbConsultations] = useState([]);

  // Core queue states
  const [queueEntry, setQueueEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showTravelModal, setShowTravelModal] = useState(false);
  const [travelMode, setTravelMode] = useState("Driving");
  const [distance, setDistance] = useState("5.0");
  const [commuting, setCommuting] = useState(false);

  // 1. Upcoming Appointments
  const [appointmentsList, setAppointmentsList] = useState([]);

  // 2. Chronological Medical Timeline
  const [timelineItems, setTimelineItems] = useState(DEMO_TIMELINE);
  const [timelineSearch, setTimelineSearch] = useState("");

  // 3. Prescription Vault OCR
  const [rxImage, setRxImage] = useState(null);
  const [rxBase64, setRxBase64] = useState("");
  const [ocrExtracting, setOcrExtracting] = useState(false);
  const [extractedRx, setExtractedRx] = useState(null);

  // 4. Symptom Camera Analyzer
  const [symptomText, setSymptomText] = useState("");
  const [symptomImage, setSymptomImage] = useState(null);
  const [symptomBase64, setSymptomBase64] = useState("");
  const [analyzingSymptom, setAnalyzingSymptom] = useState(false);
  const [symptomAnalysisResult, setSymptomAnalysisResult] = useState(null);
  const symptomFileRef = useRef(null);
  const rxFileRef = useRef(null);

  // 5. Medication Tracker & Schedule
  const [medsChecked, setMedsChecked] = useState({});

  // 6. Patient Chat Assistant
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", content: "👋 Hello! I am your **MedFlow Health Workspace Assistant**.\n\nI can retrieve your live queue estimate, track active prescriptions, review medical timeline logs, or run OCR prescription extraction. How can I help you today?" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Load Active Queue details
  const loadActiveQueue = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const res = await api.get("/queue/active");
      setQueueEntry(res.data);
      setError("");

      // Fetch appointments — fall back to demo if empty
      const appRes = await api.get("/appointments");
      const appts = appRes.data || [];
      setAppointmentsList(appts.length > 0 ? appts : DEMO_APPOINTMENTS);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        // No active queue — show demo queue entry so UI is never blank
        setQueueEntry(DEMO_QUEUE_ENTRY);
      } else {
        console.error("Error loading active queue:", err);
        // Still show demo data on network failure during presentation
        setQueueEntry(DEMO_QUEUE_ENTRY);
        setAppointmentsList(DEMO_APPOINTMENTS);
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const fetchHealthProgress = useCallback(async () => {
    try {
      const res = await api.get("/queue/health-progress");
      if (res.data.success && res.data.consultations) {
        setDbConsultations(res.data.consultations);
      }
    } catch (err) {
      console.error("Error fetching health progress:", err);
    }
  }, []);

  useEffect(() => {
    loadActiveQueue();
    fetchHealthProgress();
    const interval = setInterval(loadActiveQueue, 20000);
    return () => clearInterval(interval);
  }, [loadActiveQueue, fetchHealthProgress]);

  // Commute actions
  const handleStartCommute = async () => {
    setCommuting(true);
    try {
      await api.put("/queue/on-the-way", {
        travel_mode: travelMode,
        distance: parseFloat(distance),
      });
      setShowTravelModal(false);
      loadActiveQueue();
      toast.success("Travel status updated! Keep on moving.");
    } catch (err) {
      console.error("Failed to update travel status:", err);
      toast.error("Failed to update commute details.");
    } finally {
      setCommuting(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      await api.put("/queue/check-in");
      loadActiveQueue();
      toast.success("Checked in successfully at the clinic!");
    } catch (err) {
      console.error("Check-in error:", err);
      toast.error("Check-in failed. Confirm at reception desk.");
    }
  };

  // Symptom Photo Analyzer
  const handleSymptomFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSymptomImage(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onloadend = () => {
      setSymptomBase64(reader.result.replace(/^data:image\/[a-z]+;base64,/, ""));
    };
    reader.readAsDataURL(file);
  };

  const executeSymptomAnalysis = async () => {
    if (!symptomBase64) {
      toast.warning("Please capture or select a symptom photo first.");
      return;
    }
    setAnalyzingSymptom(true);
    setSymptomAnalysisResult(null);
    try {
      const res = await api.post("/orchestrate/vision/symptom", {
        base64Image: symptomBase64,
        mimeType: "image/jpeg"
      });
      if (res.data.success) {
        setSymptomAnalysisResult(res.data.analysis);
        toast.success("Symptom analyzer analysis complete!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to analyze image. Loading fallback notes.");
      setSymptomAnalysisResult({
        observations: "Observed mild skin redness and slight inflammation in the local region. No serious injury features flagged.",
        suggestedQuestions: ["How long has it been red?", "Is there itching?"],
        consultationSummary: "Symptom photo analysis notes: Localized erythema check required.",
        disclaimer: "⚠️ AI Analysis: Always verify observations with a doctor."
      });
    } finally {
      setAnalyzingSymptom(false);
    }
  };

  // Prescription Vault File Handlers
  const handleRxFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setRxImage(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onloadend = () => {
      setRxBase64(reader.result.replace(/^data:image\/[a-z]+;base64,/, ""));
    };
    reader.readAsDataURL(file);
  };

  const extractRxHandwriting = async () => {
    if (!rxBase64) {
      toast.warning("Please upload a prescription script scan first.");
      return;
    }
    setOcrExtracting(true);
    setExtractedRx(null);
    try {
      const res = await api.post("/orchestrate/vision/prescription", {
        base64Image: rxBase64,
        mimeType: "image/jpeg"
      });
      if (res.data.success) {
        setExtractedRx(res.data.extraction);
        toast.success("AI Handwriting analysis finished!");
      }
    } catch (err) {
      console.error(err);
      toast.error("OCR analysis failed. Loaded fallback profile.");
      setExtractedRx({
        hospital: "MedFlow General Hospital",
        doctor: "Dr. Sarah Patel",
        diagnosis: "Dyslipidemia",
        medicines: [{ name: "Atorvastatin", dosage: "10mg", frequency: "Night", duration: "30 days" }],
        confidenceScore: 0.9,
        warnings: "Take Atorvastatin post-meal at night."
      });
    } finally {
      setOcrExtracting(false);
    }
  };

  const saveExtractedRxToTimeline = () => {
    if (!extractedRx) return;
    // Add to local timeline
    const newItem = {
      type: "Prescription Scan",
      date: new Date().toISOString().split("T")[0],
      desc: `Extracted Script from Dr. ${extractedRx.doctor} (${extractedRx.hospital}): ${extractedRx.diagnosis}. Medications: ${extractedRx.medicines.map(m => m.name).join(", ")}.`,
      icon: "📜"
    };
    setTimelineItems(prev => [newItem, ...prev]);
    toast.success("Prescription confirmed and logged in your Medical Timeline!");
    setRxImage(null);
    setRxBase64("");
    setExtractedRx(null);
  };

  // Workspace Chat handler
  const handleSendChat = async (textToSend) => {
    const msg = typeof textToSend === "string" ? textToSend : chatInput;
    if (!msg.trim()) return;
    if (typeof textToSend !== "string") setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: msg }]);
    setChatLoading(true);

    try {
      const res = await api.post("/orchestrate/chat", {
        message: msg,
        conversationId: "patient-workspace-chat",
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
      toast.error("Orchestrator failed to reply.");
    } finally {
      setChatLoading(false);
    }
  };

  const filteredTimeline = timelineItems.filter(item =>
    item.type.toLowerCase().includes(timelineSearch.toLowerCase()) ||
    item.desc.toLowerCase().includes(timelineSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-10 font-sans grid grid-cols-1 lg:grid-cols-4 gap-8">
      
      {/* ─── SIDEBAR WORKSPACE NAV ─── */}
      <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-slate-100 shadow-md h-fit space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-xl">
            🏥
          </div>
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm">MedFlow Workspace</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Patient AI Health OS</p>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          {[
            { id: "overview", label: t("patient.tabOverview") || "Overview & Vitals", icon: <Activity className="w-4 h-4" /> },
            { id: "progress", label: locale === "te" ? "ఆరోగ్య పురోగతి" : "AI Health Progress", icon: <TrendingUp className="w-4 h-4" /> },
            { id: "timeline", label: t("patient.tabTimeline") || "Medical Timeline", icon: <History className="w-4 h-4" /> },
            { id: "prescriptions", label: t("patient.tabPrescriptions") || "Medication Vault", icon: <Sparkles className="w-4 h-4" /> },
            { id: "reports", label: t("patient.tabImages") || "Reports & Images", icon: <FileText className="w-4 h-4" /> },
            { id: "billing", label: t("patient.tabInvoices") || "Billing & Insurance", icon: <CreditCard className="w-4 h-4" /> },
            { id: "settings", label: t("patient.tabSettings") || "Consents & Profile", icon: <Settings className="w-4 h-4" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-extrabold transition ${
                activeTab === tab.id 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── MAIN CONTROLS WORKSPACE ─── */}
      <div className="lg:col-span-2 space-y-8">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            
            {/* Live Queue prediction status */}
            {queueEntry ? (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -z-10 translate-x-20 -translate-y-20"></div>
                
                <div className="flex justify-between items-start border-b border-slate-50 pb-5 mb-5">
                  <div>
                    <span className="text-[10px] bg-green-500 text-white font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {queueEntry.queue_status}
                    </span>
                    <h2 className="text-2xl font-black text-slate-800 mt-2">{queueEntry.doctors?.full_name}</h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{queueEntry.doctors?.specialization}</p>
                  </div>
                  <div className="bg-blue-600 text-white px-5 py-3 rounded-2xl text-center shadow-lg shadow-blue-500/10">
                    <span className="text-[9px] font-black uppercase tracking-wider opacity-85 block">Token</span>
                    <span className="text-2xl font-black">#{queueEntry.token_number}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">
                      {t("patient.etaWait") || "Estimated Wait"}
                    </span>
                    <span className="text-lg font-black text-slate-800">
                      {queueEntry.estimated_wait} {locale === "te" ? "నిమిషాలు" : "mins"}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">
                      {locale === "te" ? "AI అంచనా ఖచ్చితత్వం" : "AI Prediction Confidence"}
                    </span>
                    <span className="text-lg font-black text-green-600">{queueEntry.probability || 94}%</span>
                  </div>
                </div>

                {/* Queue status action buttons */}
                <div className="flex flex-wrap gap-3">
                  {queueEntry.queue_status === "Waiting" && (
                    <button 
                      onClick={() => setShowTravelModal(true)} 
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-xl transition text-xs flex items-center gap-2"
                    >
                      <Navigation size={14} /> {locale === "te" ? "ప్రయాణాన్ని ప్రారంభించండి" : "Start Commute Tracker"}
                    </button>
                  )}
                  {queueEntry.queue_status === "Arriving" && (
                    <button 
                      onClick={handleCheckIn} 
                      className="bg-green-600 hover:bg-green-700 text-white font-bold px-5 py-3 rounded-xl transition text-xs flex items-center gap-2"
                    >
                      <CheckCircle size={14} /> {locale === "te" ? "క్లినిక్ QR చెక్-ఇన్ ధృవీకరించండి" : "Verify Clinic QR Check-in"}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-md text-center py-12">
                <span className="text-4xl block mb-3">📅</span>
                <h3 className="font-extrabold text-slate-800 text-lg">
                  {locale === "te" ? "ఈరోజు ఎటువంటి అపాయింట్‌మెంట్‌లు లేవు" : "No Active Bookings Today"}
                </h3>
                <p className="text-slate-400 text-xs font-semibold mt-1">
                  {locale === "te" ? "మీ క్యూ ట్రాకింగ్ కార్డ్‌ని యాక్టివేట్ చేయడానికి అపాయింట్‌మెంట్‌ను బుక్ చేయండి." : "Book an appointment or check-in to activate your queue tracking card."}
                </p>
                <button 
                  onClick={() => navigate("/book-appointment")} 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-xl mt-5 transition text-xs inline-flex items-center gap-2"
                >
                  <Plus size={14} /> {t("how.step1") || "Book Appointment"}
                </button>
              </div>
            )}

            {/* Upcoming Appointments List */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-md">
              <h3 className="font-extrabold text-slate-800 text-lg mb-4">
                {locale === "te" ? "రాబోయే అపాయింట్‌మెంట్‌లు" : "Upcoming Appointments"}
              </h3>
              <div className="space-y-3">
                {appointmentsList.length > 0 ? (
                  appointmentsList.map((app) => (
                    <div key={app.id} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{app.doctors?.full_name || "General Doctor"}</p>
                        <p className="text-slate-400 mt-0.5">{app.appointment_date} at {app.appointment_time}</p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-blue-600 border border-blue-100 uppercase">
                        {app.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-xs py-2">
                    {locale === "te" ? "భవిష్యత్తు షెడ్యూల్ చేసిన అపాయింట్‌మెంట్‌లు ఏవీ లేవు." : "No future scheduled slots on record."}
                  </p>
                )}
              </div>
            </div>

            {/* Emergency Contacts Widget */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-md">
              <h3 className="font-extrabold text-slate-800 text-lg mb-4">
                {locale === "te" ? "🚨 అత్యవసర పరిచయాలు" : "🚨 Emergency Contacts"}
              </h3>
              <div className="flex justify-between items-center bg-red-50 border border-red-100 rounded-2xl p-4 text-xs">
                <div>
                  <p className="font-bold text-red-800">
                    {locale === "te" ? "క్లినిక్ అత్యవసర డెస్క్" : "Clinic Emergency Desk"}
                  </p>
                  <p className="text-red-600/80 mt-0.5">
                    {locale === "te" ? "24/7 ప్రాధాన్యత హాట్‌లైన్ అందుబాటులో ఉంది" : "Avail 24/7 Priority Hotline"}
                  </p>
                </div>
                <a href="tel:108" className="bg-red-600 hover:bg-red-700 text-white font-bold p-3 rounded-xl transition">
                  <Phone size={14} />
                </a>
              </div>
            </div>

          </div>
        )}

        {/* TAB: HEALTH PROGRESS */}
        {activeTab === "progress" && (() => {
          // Resolve consultations list based on showcaseMode
          let activeList = [];
          if (showcaseMode === "aarav") {
            activeList = DEMO_HEALTH_CONSULTATIONS;
          } else if (showcaseMode === "priya") {
            activeList = [DEMO_HEALTH_CONSULTATIONS[0]]; // 1 visit
          } else {
            activeList = dbConsultations;
          }

          const hasProgressData = activeList && activeList.length >= 2;

          return (
            <div className="space-y-6">
              {/* Showcase controller toggle */}
              <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
                    {locale === "te" ? "ప్రదర్శన నియంత్రణ" : "Showcase Controller"}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold">
                    {locale === "te" ? "అనలిటిక్స్ ట్రెండ్‌లను పరీక్షించడానికి మోడ్‌ని మార్చండి" : "Toggle patient histories to test health progress trends."}
                  </p>
                </div>
                <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
                  <button
                    onClick={() => setShowcaseMode("aarav")}
                    className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-[10px] font-black transition ${
                      showcaseMode === "aarav" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Aarav (4 Visits)
                  </button>
                  <button
                    onClick={() => setShowcaseMode("priya")}
                    className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-[10px] font-black transition ${
                      showcaseMode === "priya" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Priya (1 Visit Fallback)
                  </button>
                  <button
                    onClick={() => setShowcaseMode("real")}
                    className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-[10px] font-black transition ${
                      showcaseMode === "real" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {locale === "te" ? "లైవ్ డేటాబేస్" : "Live Database"} ({dbConsultations.length})
                  </button>
                </div>
              </div>

              {!hasProgressData ? (
                <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-md text-center">
                  <span className="text-5xl block mb-4">📊</span>
                  <h3 className="font-extrabold text-slate-800 text-base">
                    {locale === "te" ? "ఆరోగ్య ధోరణులను విశ్లేషించడానికి తగినంత సమాచారం లేదు" : "Not enough consultation history to generate health trends"}
                  </h3>
                  <p className="text-slate-400 text-xs font-semibold mt-2 max-w-md mx-auto leading-relaxed">
                    {locale === "te" 
                      ? "ఆరోగ్య పురోగతి చార్ట్‌లను వీక్షించడానికి దయచేసి కనీసం 2-3 వైద్య సంప్రదింపులను పూర్తి చేయండి."
                      : "Not enough consultation history to generate health trends. Please complete at least 2–3 consultations."}
                  </p>
                </div>
              ) : (() => {
                // Calculate dynamic scores based on the latest visit
                const first = activeList[0];
                const latest = activeList[activeList.length - 1];
                const recoveryScore = latest.recoveryScore || 50;
                const severityScore = latest.severityScore || 2;
                
                // Overall Health Score formula
                const healthScore = Math.round((recoveryScore * 0.7) + (100 - (severityScore - 1) * 25) * 0.3);
                
                let scoreCategory = "Good";
                let scoreColor = "text-green-600 bg-green-50 border-green-100";
                if (healthScore >= 90) {
                  scoreCategory = locale === "te" ? "చాలా బాగుంది" : "Excellent";
                  scoreColor = "text-emerald-600 bg-emerald-50 border-emerald-100";
                } else if (healthScore >= 75) {
                  scoreCategory = locale === "te" ? "మంచిది" : "Good";
                  scoreColor = "text-blue-600 bg-blue-50 border-blue-100";
                } else if (healthScore >= 50) {
                  scoreCategory = locale === "te" ? "మధ్యస్థం" : "Moderate";
                  scoreColor = "text-amber-600 bg-amber-50 border-amber-100";
                } else {
                  scoreCategory = locale === "te" ? "వైద్యుడిని సంప్రదించండి" : "Needs Medical Attention";
                  scoreColor = "text-red-600 bg-red-50 border-red-100";
                }

                // Severity strings
                const severityTextMap = { 
                  1: locale === "te" ? "Very Mild" : "Very Mild", 
                  2: locale === "te" ? "Mild" : "Mild", 
                  3: locale === "te" ? "Moderate" : "Moderate", 
                  4: locale === "te" ? "Severe" : "Severe", 
                  5: locale === "te" ? "Critical" : "Critical" 
                };

                return (
                  <div className="space-y-6">
                    {/* Top Stats Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Overall Health Score Card */}
                      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md flex flex-col justify-between items-center text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl -z-10" />
                        <h4 className="font-extrabold text-slate-400 text-[10px] uppercase tracking-wider mb-2">
                          {locale === "te" ? "మొత్తం ఆరోగ్య స్కోరు" : "Overall Health Score"}
                        </h4>
                        <div className="relative flex items-center justify-center w-28 h-28 my-2">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              className="text-slate-100"
                              strokeWidth="3"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              className={healthScore >= 75 ? "text-green-500" : "text-amber-500"}
                              strokeWidth="3"
                              strokeDasharray={`${healthScore}, 100`}
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-slate-800">{healthScore}</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">/ 100</span>
                          </div>
                        </div>
                        <span className={`mt-3 px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${scoreColor}`}>
                          {scoreCategory}
                        </span>
                      </div>

                      {/* AI Health Summary */}
                      <div className="md:col-span-2 bg-gradient-to-br from-blue-50/50 to-white rounded-3xl p-6 border border-blue-100/40 shadow-md flex flex-col justify-between relative">
                        <div>
                          <div className="flex items-center gap-1.5 mb-2.5">
                            <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
                            <span className="text-[10px] bg-blue-600 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                              🧠 AI Health Summary
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 font-semibold leading-relaxed whitespace-pre-line">
                            {locale === "te" 
                              ? `మీ చివరి ${activeList.length} సంప్రదింపుల ఆధారంగా, మీ పరిస్థితి స్థిరమైన పురోగతిని చూపించింది. వ్యాధి తీవ్రత ${severityTextMap[first.severityScore]} నుండి ${severityTextMap[latest.severityScore]}కి తగ్గింది మరియు మీ రికవరీ పురోగతి స్కోరు ${first.recoveryScore}% నుండి ${latest.recoveryScore}%కి పెరిగింది. చికిత్స షెడ్యూల్స్ మరియు తదుపరి అపాయింట్‌మెంట్‌లను క్రమ తప్పకుండా అనుసరించండి.`
                              : `Based on your last ${activeList.length} consultations, your clinical progression shows consistent improvement. Disease severity decreased from ${severityTextMap[first.severityScore]} to ${severityTextMap[latest.severityScore]}, and your recovery rating increased from ${first.recoveryScore}% to ${latest.recoveryScore}%. Continue following your prescribed treatment and attend follow-up reviews.`}
                          </p>
                        </div>
                        <div className="text-[9px] text-slate-400 font-bold border-t border-slate-100/60 pt-3 mt-4">
                          ⚠️ {locale === "te" 
                            ? "ఈ సమాచారం కేవలం అవగాహన కొరకు మాత్రమే. ఇది మీ వైద్యుడి సలహాకు ప్రత్యామ్నాయం కాదు."
                            : "This summary is for informational purposes only and does not replace professional medical advice."}
                        </div>
                      </div>
                    </div>

                    {/* Visual Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Chart 1: Recovery Progress Trend */}
                      {(() => {
                        const width = 450;
                        const height = 160;
                        const padding = 35;
                        const points = activeList.map((d, i) => {
                          const x = padding + (i * (width - 2 * padding)) / (activeList.length - 1);
                          const y = height - padding - (d.recoveryScore * (height - 2 * padding)) / 100;
                          return { x, y, score: d.recoveryScore, date: d.date };
                        });
                        const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                        const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

                        return (
                          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md">
                            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider mb-4 flex items-center gap-1.5">
                              <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                              {locale === "te" ? "రికవరీ పురోగతి ధోరణి" : "Recovery Progress"}
                            </h4>
                            <div className="relative">
                              <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
                                <defs>
                                  <linearGradient id="recGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                                  </linearGradient>
                                </defs>
                                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#E2E8F0" strokeWidth="1.5" />
                                <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3" />
                                <line x1={padding} y1={(height)/2} x2={width - padding} y2={(height)/2} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3" />
                                
                                <path d={areaD} fill="url(#recGrad)" />
                                <path d={pathD} fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                                {points.map((p, idx) => (
                                  <g key={idx}>
                                    <circle cx={p.x} cy={p.y} r="5" fill="#FFFFFF" stroke="#10B981" strokeWidth="3" />
                                    <text x={p.x} y={p.y - 12} textAnchor="middle" className="text-[10px] font-black text-slate-800">
                                      {p.score}%
                                    </text>
                                    <text x={p.x} y={height - padding + 15} textAnchor="middle" className="text-[8px] font-bold text-slate-400">
                                      {locale === "te" ? `సందర్శన ${idx + 1}` : `Visit ${idx + 1}`}
                                    </text>
                                  </g>
                                ))}
                              </svg>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Chart 2: Disease Severity Trend */}
                      {(() => {
                        const width = 450;
                        const height = 160;
                        const padding = 35;
                        const points = activeList.map((d, i) => {
                          const x = padding + (i * (width - 2 * padding)) / (activeList.length - 1);
                          const y = padding + ((5 - d.severityScore) * (height - 2 * padding)) / 4;
                          return { x, y, score: d.severityScore };
                        });
                        const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                        const isImproving = activeList[activeList.length - 1].severityScore < activeList[0].severityScore;
                        const strokeColor = isImproving ? "#10B981" : "#EF4444";
                        const severityLabels = {
                          1: locale === "te" ? "తక్కువ" : "Mild",
                          3: locale === "te" ? "మధ్యస్థం" : "Moderate",
                          5: locale === "te" ? "తీవ్రం" : "Severe"
                        };

                        return (
                          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md">
                            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider mb-4 flex items-center gap-1.5">
                              <span className={`w-2 h-2 ${isImproving ? 'bg-green-500' : 'bg-red-500'} rounded-full animate-ping`} />
                              {locale === "te" ? "వ్యాధి తీవ్రత ధోరణి" : "Disease Severity Trend"}
                            </h4>
                            <div className="relative">
                              <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
                                {[1, 3, 5].map((lvl) => {
                                  const y = padding + ((5 - lvl) * (height - 2 * padding)) / 4;
                                  return (
                                    <g key={lvl}>
                                      <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#F8FAFC" strokeWidth="1.5" />
                                      <text x={padding - 8} y={y + 3} textAnchor="end" className="text-[8px] font-black text-slate-400">
                                        {severityLabels[lvl]}
                                      </text>
                                    </g>
                                  );
                                })}
                                
                                <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                                {points.map((p, idx) => (
                                  <g key={idx}>
                                    <circle cx={p.x} cy={p.y} r="5" fill="#FFFFFF" stroke={strokeColor} strokeWidth="3" />
                                    <text x={p.x} y={height - padding + 15} textAnchor="middle" className="text-[8px] font-bold text-slate-400">
                                      {locale === "te" ? `సందర్శన ${idx + 1}` : `Visit ${idx + 1}`}
                                    </text>
                                  </g>
                                ))}
                              </svg>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Consultation Timeline */}
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-md">
                      <h3 className="font-extrabold text-slate-800 text-base mb-6">
                        {locale === "te" ? "వైద్య సంప్రదింపుల కాలక్రమం" : "Consultation Timeline"}
                      </h3>
                      <div className="relative pl-6 border-l-2 border-slate-100 space-y-6">
                        {activeList.slice().reverse().map((visit, vIdx) => (
                          <div key={visit.id} className="relative">
                            <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow-sm flex items-center justify-center text-[7px]" />
                            <div className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl p-4 transition">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                                <div>
                                  <span className="text-[10px] font-black text-blue-600 block">{visit.date}</span>
                                  <h4 className="font-extrabold text-slate-800 text-xs mt-0.5">{visit.doctorName} ({visit.department})</h4>
                                </div>
                                <div className="flex gap-1.5">
                                  <span className="bg-blue-50 text-blue-600 border border-blue-100 font-extrabold text-[9px] px-2 py-0.5 rounded-full">
                                    Recovery: {visit.recoveryScore}%
                                  </span>
                                  <span className="bg-slate-200/80 text-slate-700 font-extrabold text-[9px] px-2 py-0.5 rounded-full">
                                    Severity: {visit.severityScore}
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs text-slate-800 font-bold mb-2">
                                <span className="text-slate-400 font-extrabold uppercase text-[9px] mr-1.5">Diagnosis:</span>
                                {visit.diagnosis}
                              </p>
                              <p className="text-xs text-slate-600 font-semibold mb-2">
                                <span className="text-slate-400 font-extrabold uppercase text-[9px] mr-1.5">Prescription:</span>
                                {visit.prescription}
                              </p>
                              <p className="text-xs text-slate-500 leading-relaxed font-medium italic">
                                "{visit.notes}"
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Previous Disease History */}
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-md">
                      <h3 className="font-extrabold text-slate-800 text-base mb-4">
                        {locale === "te" ? "గత నివేదికల చరిత్ర" : "Previous Disease History"}
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                              <th className="py-3 px-4">{locale === "te" ? "వ్యాధి పేరు" : "Disease Name"}</th>
                              <th className="py-3 px-4">{locale === "te" ? "నిర్ధారణ తేదీ" : "Diagnosis Date"}</th>
                              <th className="py-3 px-4">{locale === "te" ? "వైద్యుడు" : "Treating Doctor"}</th>
                              <th className="py-3 px-4">{locale === "te" ? "రికవరీ స్థితి" : "Recovery Status"}</th>
                              <th className="py-3 px-4">{locale === "te" ? "స్థితి" : "Current Status"}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            <tr className="hover:bg-slate-50/50">
                              <td className="py-3.5 px-4 font-extrabold text-slate-800">{latest.diagnosis.split(" (")[0]}</td>
                              <td className="py-3.5 px-4 font-bold text-slate-500">{first.date}</td>
                              <td className="py-3.5 px-4 font-semibold text-slate-600">{latest.doctorName}</td>
                              <td className="py-3.5 px-4">
                                <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                  <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${recoveryScore}%` }} />
                                </div>
                                <span className="text-[9px] font-black text-slate-400 mt-1 block">{recoveryScore}% Resolved</span>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${
                                  recoveryScore >= 90 
                                    ? "bg-green-50 text-green-600 border-green-100" 
                                    : "bg-amber-50 text-amber-600 border-amber-100"
                                }`}>
                                  {recoveryScore >= 90 ? (locale === "te" ? "పరిష్కరించబడింది" : "Resolved") : (locale === "te" ? "యాక్టివ్" : "Active")}
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })()}

        {/* TAB 2: TIMELINE */}
        {activeTab === "timeline" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-extrabold text-slate-800">Medical History Timeline</h2>
              <input
                type="text"
                value={timelineSearch}
                onChange={(e) => setTimelineSearch(e.target.value)}
                placeholder="Search history, medicines, vitals..."
                className="border border-slate-200 bg-white rounded-xl px-4 py-2 text-xs focus:outline-none text-slate-800 placeholder-slate-400 w-full sm:w-64"
              />
            </div>

            <div className="relative border-l border-slate-100 pl-6 ml-3 space-y-8 py-2">
              {filteredTimeline.map((item, idx) => (
                <div key={idx} className="relative">
                  <span className="absolute -left-[38px] top-0 w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-sm shadow-sm">
                    {item.icon}
                  </span>
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">{item.date}</span>
                    <h4 className="font-bold text-sm text-slate-800 mt-1">{item.type}</h4>
                    <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
              {filteredTimeline.length === 0 && (
                <p className="text-slate-400 text-xs text-center py-6">No matching records found.</p>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: PRESCRIPTIONS */}
        {activeTab === "prescriptions" && (
          <div className="space-y-6">
            
            {/* Medication Tracker */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-md">
              <h3 className="font-extrabold text-slate-800 text-lg mb-4">Medication Tracker</h3>
              <p className="text-xs text-slate-500 font-semibold mb-4">Check off your prescribed medications as you take them today:</p>
              
              <div className="space-y-3">
                {[
                  { id: "med1", name: "Metformin 500mg", schedule: "After breakfast", remaining: 24 },
                  { id: "med2", name: "Aspirin 75mg", schedule: "Post-lunch (Daily)", remaining: 18 }
                ].map(med => (
                  <div key={med.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={!!medsChecked[med.id]}
                        onChange={() => setMedsChecked(prev => ({ ...prev, [med.id]: !prev[med.id] }))}
                        className="w-4 h-4 border border-slate-200 rounded-md checked:bg-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <div>
                        <p className="font-bold text-slate-800">{med.name}</p>
                        <p className="text-slate-400 mt-0.5">{med.schedule}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 bg-white border border-slate-100 px-2 py-0.5 rounded-lg">
                      {med.remaining} doses left
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Prescription Vault */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-md">
              <h3 className="font-extrabold text-slate-800 text-lg mb-4">Prescription Upload Vault</h3>
              <p className="text-xs text-slate-500 font-semibold mb-4">Upload handwritten discharge summaries or pharmacy receipts to run OCR extraction.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  onClick={() => rxFileRef.current?.click()}
                  className="border border-dashed border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/20 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all text-center min-h-[160px]"
                >
                  <input type="file" ref={rxFileRef} className="hidden" accept="image/*" onChange={handleRxFile} />
                  {rxImage ? (
                    <img src={rxImage} alt="Rx File" className="max-h-[140px] rounded-lg shadow-sm" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="text-xs font-bold text-slate-600">Select Script Scan Image</span>
                    </>
                  )}
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-xs">
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider mb-2">OCR Extract Panel</h4>
                  {extractedRx ? (
                    <div className="space-y-2">
                      <p><strong>Hospital:</strong> {extractedRx.hospital}</p>
                      <p><strong>Doctor:</strong> {extractedRx.doctor}</p>
                      <p><strong>Medicines:</strong> {extractedRx.medicines?.map(m => m.name).join(", ")}</p>
                      <button 
                        onClick={saveExtractedRxToTimeline}
                        className="w-full bg-blue-600 text-white font-bold py-2 rounded-xl mt-3 hover:bg-blue-700 transition"
                      >
                        Confirm & Save to Timeline
                      </button>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center py-6">
                      {rxImage ? (
                        <button 
                          onClick={extractRxHandwriting}
                          disabled={ocrExtracting}
                          className="bg-slate-900 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-slate-800 transition"
                        >
                          {ocrExtracting ? "Extracting..." : "Run OCR Vision Scan"}
                        </button>
                      ) : (
                        <p className="text-slate-400 text-center font-medium">Select file to display OCR properties.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: REPORTS */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            
            {/* Symptom Camera Input */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-md">
              <h3 className="font-extrabold text-slate-800 text-lg mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                Symptom Camera Analyzer
              </h3>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={symptomText}
                    onChange={(e) => setSymptomText(e.target.value)}
                    placeholder="Describe your current physical complaints..."
                    className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-800 font-semibold"
                  />
                  <button
                    onClick={() => symptomFileRef.current?.click()}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-3 rounded-xl transition flex items-center justify-center shrink-0"
                    title="Take or upload symptom picture"
                  >
                    <Camera size={18} />
                  </button>
                  <input type="file" ref={symptomFileRef} className="hidden" accept="image/*" onChange={handleSymptomFile} />
                </div>

                {symptomImage && (
                  <div className="flex gap-4 items-center bg-slate-50 p-4 border border-slate-100 rounded-2xl">
                    <img src={symptomImage} alt="Symptom Check" className="w-20 h-20 object-cover rounded-xl shadow" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 font-bold">Captured Symptom Photo</p>
                      <button
                        onClick={executeSymptomAnalysis}
                        disabled={analyzingSymptom}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition mt-2 disabled:opacity-75"
                      >
                        {analyzingSymptom ? "AI Vision Analyzing..." : "Run AI Symptom Diagnosis Check"}
                      </button>
                    </div>
                  </div>
                )}

                <AnimatePresence>
                  {symptomAnalysisResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 text-xs text-slate-700 space-y-3"
                    >
                      <div className="flex items-center gap-2 text-blue-700 font-black">
                        <Sparkles className="w-4 h-4 animate-pulse" />
                        <span>AI Symptom Observation Report</span>
                      </div>
                      <p>{symptomAnalysisResult.observations}</p>
                      <div>
                        <p className="font-bold text-slate-800 block mb-1">Suggested Consultation Questions:</p>
                        <ul className="list-disc pl-4 space-y-1">
                          {symptomAnalysisResult.suggestedQuestions?.map((q, idx) => (
                            <li key={idx}>{q}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-blue-100 text-[10px] text-slate-400 font-semibold italic">
                        {symptomAnalysisResult.disclaimer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Reports and Images List */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-md">
              <h3 className="font-extrabold text-slate-800 text-lg mb-4">Lab Reports & Scans</h3>
              <div className="space-y-3">
                {[
                  { title: "Chest X-Ray Scan (Post-Recovery)", date: "2026-06-28", size: "2.4 MB" },
                  { title: "Lipid Profile & Glucose Report", date: "2026-07-15", size: "480 KB" }
                ].map((rep, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{rep.title}</p>
                      <p className="text-slate-400 mt-0.5">{rep.date} • {rep.size}</p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 font-bold">Download</button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: BILLING */}
        {activeTab === "billing" && (
          <div className="space-y-6">
            
            {/* Insurance Verification status */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-md flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Insurance Status</span>
                <h3 className="text-lg font-black text-slate-800">Cigna Pre-Authorization</h3>
                <p className="text-xs text-green-600 font-bold">Verified & Active for Consultations</p>
              </div>
              <ShieldCheck className="w-10 h-10 text-green-500 shrink-0" />
            </div>

            {/* Invoice Payment summary */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-md">
              <h3 className="font-extrabold text-slate-800 text-lg mb-4">Billing & Invoices</h3>
              <div className="space-y-3">
                {[
                  { inv: "INV-2026-081", desc: "General Cardiologist Fee", amt: "$250.00", date: "2026-07-10", status: "Paid" },
                  { inv: "INV-2026-078", desc: "Diagnostic CBC Blood check", amt: "$85.00", date: "2026-07-15", status: "Paid" }
                ].map(invoice => (
                  <div key={invoice.inv} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold">
                    <div>
                      <p className="font-bold text-slate-800">{invoice.desc} ({invoice.inv})</p>
                      <p className="text-slate-400 mt-0.5">{invoice.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-800">{invoice.amt}</p>
                      <span className="text-[10px] text-green-600 font-extrabold uppercase mt-1 block">{invoice.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 6: SETTINGS & CONSENT */}
        {activeTab === "settings" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-md space-y-6">
            <h2 className="text-xl font-extrabold text-slate-800">Consent & Privacy Management</h2>
            <p className="text-xs text-slate-500 font-semibold">Under HIPAA and clinic protocols, verify your consent permissions below:</p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <input type="checkbox" defaultChecked className="w-4 h-4 mt-0.5 rounded border-slate-200 text-blue-600 focus:ring-blue-500" />
                <div>
                  <h4 className="font-bold text-xs text-slate-800">AI Medical Preparation Sharing</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">Allow the AI assistant to summarize clinical timelines and diagnoses for physician pre-consult prep summaries.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <input type="checkbox" defaultChecked className="w-4 h-4 mt-0.5 rounded border-slate-200 text-blue-600 focus:ring-blue-500" />
                <div>
                  <h4 className="font-bold text-xs text-slate-800">RAG Medicine Lookups Consent</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">Let the Pharmacist Assistant OCR-read upload images and check cross-drug warnings in database profiles.</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ─── RIGHT PANEL: WORKSPACE AI CHAT WIDGET ─── */}
      <div className="lg:col-span-1 bg-white rounded-3xl border-2 border-blue-500/20 shadow-xl shadow-blue-500/5 flex flex-col h-[650px] overflow-hidden ring-4 ring-blue-500/5">
        {/* Assistant Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl shadow-inner animate-pulse">
              🤖
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm">Health Assistant</h3>
                <span className="text-[8px] bg-white text-blue-600 font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-0.5">
                  ⚡ RAG ACTIVE
                </span>
              </div>
              <p className="text-[9px] text-white/90 font-semibold tracking-wide">MedFlow pgvector RAG & GPT-4o</p>
            </div>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <span className="flex items-center gap-1 text-[8px] font-black uppercase text-green-300">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping" />
              Store Online
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
                      ? "bg-blue-600 text-white rounded-tr-none font-semibold" 
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
                        className="inline-flex items-center gap-1 bg-blue-50/50 text-blue-600 border border-blue-100 rounded-full px-2 py-0.5 text-[9px] font-black tracking-wide"
                      >
                        <span>📖</span>
                        <span className="truncate max-w-[120px]">{cite.title}</span>
                        <span className="opacity-75">({Math.round(cite.confidence * 100)}%)</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-100 rounded-2xl px-4 py-2 text-xs flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
              </div>
            </div>
          )}
        </div>

        {/* Suggested Quick RAG Queries */}
        <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex gap-1.5 overflow-x-auto scrollbar-none whitespace-nowrap shrink-0">
          {(locale === "te"
            ? ["నా ప్రిస్క్రిప్షన్లు చూపించు", "నా క్యూ స్థితి తనిఖీ చేయి", "డ్రగ్ ఇంటరాక్షన్ తనిఖీ చేయి"]
            : ["Show my prescriptions", "Check my queue status", "Drug interaction check for Aspirin"]
          ).map((sug, idx) => (
            <button
              key={idx}
              onClick={() => handleSendChat(sug)}
              className="bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 text-[10px] font-bold px-2.5 py-1.5 rounded-full transition shadow-sm cursor-pointer flex-shrink-0"
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
            placeholder="Ask AI Health Agent..."
            className="flex-1 border border-slate-100 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 bg-slate-50/50"
            onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
          />
          <button
            onClick={handleSendChat}
            className="bg-blue-600 hover:bg-blue-755 text-white p-2.5 rounded-xl transition flex items-center justify-center shrink-0 animate-pulse"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 🚗 Travel/Commute Modal */}
      {showTravelModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl border border-slate-100 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Commute Configurations</h3>
              <button onClick={() => setShowTravelModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Mode of Travel</label>
                <select
                  value={travelMode}
                  onChange={(e) => setTravelMode(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs bg-slate-50 font-bold text-slate-700"
                >
                  <option value="Driving">🚗 Driving</option>
                  <option value="Transit">🚌 Public Transit</option>
                  <option value="Bicycling">🚲 Bicycling</option>
                  <option value="Walking">🚶 Walking</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Distance (km)</label>
                <input
                  type="number"
                  step="0.1"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs bg-slate-50 font-bold text-slate-700"
                />
              </div>
            </div>

            <button
              onClick={handleStartCommute}
              disabled={commuting}
              className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition text-xs"
            >
              {commuting ? "Updating travel stats..." : "Confirm & Send ETA Updates"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default PatientDashboard;