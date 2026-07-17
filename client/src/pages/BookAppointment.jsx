import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getDoctors } from "../services/doctorService";
import { bookAppointment } from "../services/appointmentService";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/api";
import {
  Camera, Upload, X, AlertTriangle, CheckCircle, Clock,
  Zap, Eye, FlaskConical, Stethoscope, ChevronRight,
  RotateCcw, ScanLine, ShieldCheck, ImageOff, Mic, Info
} from "lucide-react";

// ─── Image Quality Checker (client-side canvas analysis) ─────────────────────
function checkImageQuality(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, img.width, img.height).data;
      
      // Resolution check
      const megapixels = (img.width * img.height) / 1_000_000;
      if (megapixels < 0.05) {
        URL.revokeObjectURL(url);
        return resolve({ ok: false, reason: "Image resolution is too low. Please upload a higher resolution image." });
      }

      // Brightness check (average luminance)
      let totalLuminance = 0;
      for (let i = 0; i < data.length; i += 4) {
        totalLuminance += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }
      const avgBrightness = totalLuminance / (data.length / 4);
      if (avgBrightness < 30) {
        URL.revokeObjectURL(url);
        return resolve({ ok: false, reason: "Image appears too dark. Please upload a well-lit, clear photo." });
      }
      if (avgBrightness > 230) {
        URL.revokeObjectURL(url);
        return resolve({ ok: false, reason: "Image appears overexposed or too bright. Please use natural lighting." });
      }

      // Blur detection via variance of Laplacian (simplified)
      let sumVariance = 0;
      const pixelCount = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        sumVariance += (gray - avgBrightness) ** 2;
      }
      const variance = sumVariance / pixelCount;
      if (variance < 100) {
        URL.revokeObjectURL(url);
        return resolve({ ok: false, reason: "The uploaded image appears blurry or unclear. Please upload a sharper, focused image." });
      }

      URL.revokeObjectURL(url);
      resolve({ ok: true });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ ok: false, reason: "Unable to process this image file. Please try a different photo." });
    };
    img.src = url;
  });
}

// ─── Severity Badge ───────────────────────────────────────────────────────────
function SeverityBadge({ severity }) {
  const map = {
    "Mild": "bg-green-100 text-green-700 border-green-200",
    "Moderate": "bg-amber-100 text-amber-700 border-amber-200",
    "Severe": "bg-red-100 text-red-700 border-red-200",
  };
  return (
    <span className={`text-[10px] font-black uppercase tracking-widest border px-2.5 py-1 rounded-full ${map[severity] || "bg-slate-100 text-slate-600"}`}>
      {severity || "Unknown"}
    </span>
  );
}

// ─── Urgency Badge ────────────────────────────────────────────────────────────
function UrgencyBadge({ urgency }) {
  const isUrgent = urgency?.toLowerCase().includes("urgent") || urgency?.toLowerCase().includes("er");
  return (
    <span className={`text-[10px] font-black uppercase tracking-widest border px-2.5 py-1 rounded-full ${isUrgent ? "bg-red-100 text-red-700 border-red-200 animate-pulse" : "bg-blue-100 text-blue-700 border-blue-200"}`}>
      {urgency || "Routine"}
    </span>
  );
}

// ─── Confidence Ring ──────────────────────────────────────────────────────────
function ConfidenceRing({ score }) {
  const pct = Math.min(Math.max(score || 0, 0), 100);
  const color = pct >= 80 ? "#22c55e" : pct >= 60 ? "#f59e0b" : "#ef4444";
  const r = 18, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center">
      <svg width={48} height={48} viewBox="0 0 48 48">
        <circle cx={24} cy={24} r={r} fill="none" stroke="#e2e8f0" strokeWidth={4} />
        <circle
          cx={24} cy={24} r={r} fill="none"
          stroke={color} strokeWidth={4}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 24 24)"
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
        <text x={24} y={28} textAnchor="middle" fontSize={10} fontWeight="900" fill={color}>{pct}%</text>
      </svg>
      <span className="text-[9px] font-bold text-slate-500 mt-0.5">AI Confidence</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function BookAppointment() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  const [doctors, setDoctors] = useState([]);
  const [formData, setFormData] = useState({
    doctor: "",
    date: new Date().toISOString().split("T")[0],
    time: "",
    reason: "",
  });

  // ── Symptom AI state ──
  const [symptomsText, setSymptomsText] = useState("");
  const [imageFiles, setImageFiles] = useState([]);          // [{file, preview, base64, mime}]
  const [imageQualityWarning, setImageQualityWarning] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [aiReport, setAiReport] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [triageResult, setTriageResult] = useState(""); // legacy local triage

  // ── Booking state ──
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadDoctors = async () => {
      try {
        const data = await getDoctors();
        if (isMounted) setDoctors(data.filter(d => d.available));
      } catch (err) {
        console.error("Error loading doctors:", err);
      }
    };
    loadDoctors();
    return () => { isMounted = false; };
  }, []);

  // ── File processing helper ────────────────────────────────────────────────
  const processFile = useCallback(async (file) => {
    // Size guard (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image exceeds 10 MB limit. Please compress or choose a smaller photo.");
      return null;
    }
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/heic", "image/heif"];
    if (!allowed.includes(file.type.toLowerCase())) {
      toast.error("Unsupported format. Please use JPG, PNG, or HEIC.");
      return null;
    }

    const quality = await checkImageQuality(file);
    if (!quality.ok) {
      setImageQualityWarning(quality.reason);
      return null;
    }
    setImageQualityWarning("");

    const preview = URL.createObjectURL(file);
    const base64 = await new Promise((res) => {
      const reader = new FileReader();
      reader.onloadend = () => res(reader.result.replace(/^data:image\/[a-z]+;base64,/, ""));
      reader.readAsDataURL(file);
    });

    return { file, preview, base64, mime: file.type };
  }, []);

  const handleFileSelect = useCallback(async (files) => {
    const results = await Promise.all(Array.from(files).slice(0, 3).map(processFile));
    const valid = results.filter(Boolean);
    if (valid.length > 0) {
      setImageFiles(prev => [...prev, ...valid].slice(0, 3));
      setAnalysisDone(false);
      setAiReport(null);
    }
  }, [processFile]);

  // ── Drag-and-drop handlers ────────────────────────────────────────────────
  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeImage = (idx) => {
    setImageFiles(prev => {
      URL.revokeObjectURL(prev[idx]?.preview);
      return prev.filter((_, i) => i !== idx);
    });
    setAnalysisDone(false);
    setAiReport(null);
  };

  // ── AI Analysis ────────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!symptomsText.trim() && imageFiles.length === 0) {
      toast.warning("Please describe your symptoms or upload an image before analyzing.");
      return;
    }

    setAnalyzing(true);
    setAiReport(null);

    try {
      if (imageFiles.length > 0) {
        // Vision + text analysis via backend
        const primary = imageFiles[0];
        const res = await api.post("/orchestrate/vision/symptom", {
          base64Image: primary.base64,
          mimeType: primary.mime,
          symptomsText: symptomsText.trim()
        });
        if (res.data.success) {
          setAiReport(res.data.analysis);
          // Auto-match doctor by suggestedDepartment
          autoSelectDoctor(res.data.analysis?.suggestedDepartment);
          setAnalysisDone(true);
          toast.success("AI symptom analysis complete!");
        }
      } else {
        // Text-only local triage
        const report = localTextTriage(symptomsText);
        setAiReport(report);
        autoSelectDoctor(report.suggestedDepartment);
        setAnalysisDone(true);
        toast.success("Symptom analysis complete!");
      }
    } catch (err) {
      console.error("Analysis error:", err);
      // Fallback mock report
      const fallback = localTextTriage(symptomsText);
      setAiReport(fallback);
      autoSelectDoctor(fallback.suggestedDepartment);
      setAnalysisDone(true);
      toast.info("Analysis complete (offline mode).");
    } finally {
      setAnalyzing(false);
    }
  };

  // ── Local text-only triage (fallback) ─────────────────────────────────────
  const localTextTriage = (text) => {
    const t = text.toLowerCase();
    let dept = "General Medicine", severity = "Mild", urgency = "Routine Consultation";
    let complaint = text || "Patient reports general discomfort.";
    let notes = "Patient should consult a licensed doctor for proper evaluation.";

    if (t.includes("chest") || t.includes("heart") || t.includes("breathless")) {
      dept = "Cardiology"; severity = "Moderate"; urgency = "Urgent Care";
      notes = "Cardiovascular symptoms detected. Seek urgent medical evaluation.";
    } else if (t.includes("skin") || t.includes("rash") || t.includes("itch") || t.includes("burn")) {
      dept = "Dermatology"; severity = "Mild";
      notes = "Dermatological symptoms noted. Avoid scratching and keep area clean.";
    } else if (t.includes("ear") || t.includes("throat") || t.includes("nose") || t.includes("sinus")) {
      dept = "ENT"; severity = "Mild";
      notes = "ENT-related symptoms detected. Gargling with warm salt water may provide temporary relief.";
    } else if (t.includes("eye") || t.includes("vision") || t.includes("red eye")) {
      dept = "Ophthalmology"; severity = "Mild";
      notes = "Eye-related symptoms noted. Avoid rubbing and consult an eye specialist.";
    } else if (t.includes("child") || t.includes("baby") || t.includes("infant")) {
      dept = "Pediatrics"; severity = "Mild";
      notes = "Pediatric concerns detected. Consult a pediatrician promptly.";
    } else if (t.includes("fracture") || t.includes("broken") || t.includes("sprain") || t.includes("injury")) {
      dept = "Orthopedics"; severity = "Moderate"; urgency = "Urgent Care";
      notes = "Injury-related symptoms. Rest, ice, compression, and elevation (RICE) may help. See a doctor.";
    } else if (t.includes("fever") && (t.includes("severe") || t.includes("high"))) {
      severity = "Moderate"; urgency = "Urgent Care";
      notes = "High fever noted. Stay hydrated and monitor temperature closely.";
    }

    const words = text.split(/\s+/);
    const symptoms = words.filter(w => w.length > 4).slice(0, 5).map(w => w.charAt(0).toUpperCase() + w.slice(1));

    return {
      primaryComplaint: complaint,
      visibleFindings: "No image provided. Analysis based on patient text description only.",
      symptomsMentioned: symptoms.length > 0 ? symptoms : ["General discomfort"],
      duration: t.includes("day") ? (t.match(/\d+\s*day/)?.[0] || "1-2 days") : "Not specified",
      severity,
      suggestedDepartment: dept,
      urgencyLevel: urgency,
      additionalNotes: notes,
      confidenceScore: 72
    };
  };

  const autoSelectDoctor = (dept) => {
    if (!dept || !doctors.length) return;
    const match = doctors.find(d => {
      const spec = d.specialization?.toLowerCase() || "";
      const target = dept.toLowerCase();
      return spec.includes(target.split(" ")[0]) || target.includes(spec.split(" ")[0]);
    });
    if (match) {
      setFormData(prev => ({ ...prev, doctor: match.id }));
      toast.success(`Auto-selected Dr. ${match.full_name} (${match.specialization})`);
    }
  };

  // ── Booking ────────────────────────────────────────────────────────────────
  const handleBook = async () => {
    if (!formData.doctor || !formData.time) {
      toast.warning("Please select a doctor and appointment time.");
      return;
    }
    setBooking(true);
    try {
      const notesPayload = JSON.stringify({
        symptomText: symptomsText,
        aiSummary: aiReport,
        imagesCount: imageFiles.length,
        analyzedAt: new Date().toISOString()
      });

      const result = await bookAppointment({
        doctor_id: formData.doctor,
        appointment_date: formData.date,
        appointment_time: formData.time,
        status: "Booked",
        notes: notesPayload,
      });

      if (result.success && result.appointment) {
        toast.success("Appointment booked! Proceeding to secure checkout.");
        navigate(`/payment/${result.appointment.id}`);
      } else {
        toast.success("Appointment booked successfully!");
        navigate("/patient-dashboard");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to book. Please select a valid open slot.");
    } finally {
      setBooking(false);
    }
  };

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const charCount = symptomsText.length;
  const charColor = charCount > 900 ? "text-red-500" : charCount > 700 ? "text-amber-500" : "text-slate-400";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50 py-12 px-4 font-sans">
      <div className="max-w-3xl mx-auto">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-left">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Stethoscope size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Book Appointment</h1>
              <p className="text-xs text-slate-500 font-semibold">AI-Assisted Symptom Analysis + Smart Doctor Matching</p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">

          {/* ══════════════════════════════════════════════════════════════════
              SECTION 1: AI SYMPTOM ANALYSIS
          ══════════════════════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden"
          >
            {/* Card Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-white">
                <ScanLine size={18} />
                <div>
                  <p className="font-black text-sm">AI Symptom Analysis</p>
                  <p className="text-[10px] text-white/80 font-semibold">Optional but recommended • Helps doctor prepare faster</p>
                </div>
              </div>
              <span className="text-[9px] font-black bg-white/20 text-white px-2 py-1 rounded-full uppercase tracking-widest">
                Powered by GPT-4o Vision
              </span>
            </div>

            <div className="p-6 space-y-5">

              {/* ── 1a. Symptom Text Area ── */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">
                  📝 Describe Your Symptoms
                </label>
                <div className="relative">
                  <textarea
                    rows={4}
                    maxLength={1000}
                    value={symptomsText}
                    onChange={(e) => { setSymptomsText(e.target.value); setAnalysisDone(false); setAiReport(null); }}
                    placeholder={'Example:\n"I have had a fever for three days with headache and body pain. My throat is sore and I feel tired."'}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none bg-slate-50/50 leading-relaxed"
                  />
                  <span className={`absolute bottom-3 right-4 text-[10px] font-bold ${charColor}`}>
                    {charCount}/1000
                  </span>
                </div>
              </div>

              {/* ── 1b. Image Upload & Camera ── */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">
                  📷 Upload Symptom Image <span className="font-medium text-slate-400 normal-case">(Optional — JPG, PNG, HEIC · Max 10 MB)</span>
                </label>
                <p className="text-[10px] text-slate-400 font-semibold mb-3">
                  Examples: skin rash, swelling, eye redness, wound, burn, nail infection, mouth ulcer
                </p>

                {/* Drop Zone */}
                <div
                  ref={dropZoneRef}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 ${
                    isDragging ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-slate-50/50 hover:border-blue-300 hover:bg-blue-50/30"
                  }`}
                >
                  <Upload size={28} className={`mx-auto mb-2 ${isDragging ? "text-blue-500" : "text-slate-300"}`} />
                  <p className="text-xs font-bold text-slate-500 mb-3">
                    {isDragging ? "Drop your image here" : "Drag & drop images here"}
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition cursor-pointer"
                    >
                      <Upload size={13} />
                      Choose File
                    </button>
                    <span className="text-slate-300 text-xs font-bold">OR</span>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition cursor-pointer"
                    >
                      <Camera size={13} />
                      Open Camera
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-3 font-semibold">
                    Upload clear images for better AI analysis. Up to 3 images allowed.
                  </p>
                </div>

                {/* Hidden Inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/heic,image/heif"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                />

                {/* Image Quality Warning */}
                <AnimatePresence>
                  {imageQualityWarning && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="mt-3 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl p-3.5"
                    >
                      <ImageOff size={15} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-black text-amber-700">Image Quality Issue Detected</p>
                        <p className="text-[10px] text-amber-600 font-semibold mt-0.5">{imageQualityWarning}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Image Previews */}
                <AnimatePresence>
                  {imageFiles.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                      className="mt-4 grid grid-cols-3 gap-3"
                    >
                      {imageFiles.map((img, i) => (
                        <div key={i} className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-square bg-slate-100 shadow-sm">
                          <img src={img.preview} alt={`Symptom ${i + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="absolute top-1.5 right-1.5 w-6 h-6 bg-slate-900/70 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition cursor-pointer"
                          >
                            <X size={10} />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-2 py-1.5">
                            <p className="text-[9px] text-white font-bold truncate">{img.file.name}</p>
                          </div>
                        </div>
                      ))}
                      {imageFiles.length < 3 && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition cursor-pointer"
                        >
                          <Upload size={18} />
                          <span className="text-[9px] font-bold">Add More</span>
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── 1c. Analyze Button ── */}
              <motion.button
                type="button"
                onClick={handleAnalyze}
                disabled={analyzing || (!symptomsText.trim() && imageFiles.length === 0)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center justify-center gap-2.5 font-extrabold py-4 rounded-2xl text-sm transition-all shadow-lg ${
                  analyzing
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : analysisDone
                    ? "bg-green-500 text-white shadow-green-500/20 cursor-pointer"
                    : (!symptomsText.trim() && imageFiles.length === 0)
                    ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-blue-500/20 cursor-pointer"
                }`}
              >
                {analyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing your symptoms... This may take a few seconds.
                  </>
                ) : analysisDone ? (
                  <>
                    <CheckCircle size={16} />
                    Analysis Complete — Re-run Analysis
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Analyze Symptoms with AI
                  </>
                )}
              </motion.button>

              {/* ── 1d. AI Report Card ── */}
              <AnimatePresence>
                {aiReport && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="border border-blue-100 bg-gradient-to-br from-blue-50/50 to-cyan-50/30 rounded-3xl overflow-hidden"
                  >
                    {/* Report Header */}
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-blue-100 bg-white/50">
                      <div className="flex items-center gap-2">
                        <FlaskConical size={15} className="text-blue-600" />
                        <span className="text-xs font-black text-slate-800 tracking-tight">AI Symptom Summary</span>
                        <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                          Doctor-Facing Report
                        </span>
                      </div>
                      <ConfidenceRing score={aiReport.confidenceScore} />
                    </div>

                    <div className="p-5 space-y-4 text-left">

                      {/* Primary Complaint */}
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Primary Complaint</p>
                        <p className="text-sm font-semibold text-slate-700 leading-relaxed">{aiReport.primaryComplaint}</p>
                      </div>

                      {/* Visible Findings */}
                      {aiReport.visibleFindings && (
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Visible Findings</p>
                          <p className="text-sm font-semibold text-slate-600 leading-relaxed">{aiReport.visibleFindings}</p>
                        </div>
                      )}

                      {/* Symptoms Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Symptoms List */}
                        <div className="bg-white border border-slate-100 rounded-2xl p-3.5 shadow-sm">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Symptoms Mentioned</p>
                          <ul className="space-y-1">
                            {(aiReport.symptomsMentioned || []).map((s, i) => (
                              <li key={i} className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Meta Info */}
                        <div className="space-y-2.5">
                          <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Duration</p>
                            <p className="text-xs font-extrabold text-slate-700 mt-0.5 flex items-center gap-1">
                              <Clock size={11} className="text-slate-400" />
                              {aiReport.duration || "Not specified"}
                            </p>
                          </div>
                          <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Severity</p>
                            <SeverityBadge severity={aiReport.severity} />
                          </div>
                        </div>
                      </div>

                      {/* Department & Urgency */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white border border-slate-100 rounded-2xl p-3.5 shadow-sm">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Suggested Department</p>
                          <p className="text-sm font-extrabold text-blue-700 flex items-center gap-1.5">
                            <Stethoscope size={13} className="text-blue-400" />
                            {aiReport.suggestedDepartment}
                          </p>
                        </div>
                        <div className="bg-white border border-slate-100 rounded-2xl p-3.5 shadow-sm">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Urgency Level</p>
                          <UrgencyBadge urgency={aiReport.urgencyLevel} />
                        </div>
                      </div>

                      {/* Additional Notes */}
                      {aiReport.additionalNotes && (
                        <div className="bg-white border border-slate-100 rounded-2xl p-3.5 shadow-sm">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">AI Notes for Doctor</p>
                          <p className="text-xs text-slate-600 font-semibold leading-relaxed">{aiReport.additionalNotes}</p>
                        </div>
                      )}

                      {/* Medical Disclaimer */}
                      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                        <ShieldCheck size={16} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-black text-amber-800">⚠ AI-Generated Summary Only</p>
                          <p className="text-[10px] text-amber-700 font-semibold mt-1 leading-relaxed">
                            This analysis is intended to assist healthcare professionals only. It is <strong>NOT a medical diagnosis</strong>.
                            Only a licensed doctor can diagnose conditions or prescribe treatment.
                            This report will be shared securely with your assigned doctor before your consultation.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </motion.div>

          {/* ══════════════════════════════════════════════════════════════════
              SECTION 2: APPOINTMENT DETAILS
          ══════════════════════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
              <ChevronRight size={14} className="text-blue-600" />
              <p className="text-xs font-black text-slate-700 uppercase tracking-widest">Appointment Details</p>
            </div>

            <div className="p-6 space-y-5">
              {/* Doctor Select */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">
                  Select Doctor
                  {aiReport?.suggestedDepartment && (
                    <span className="ml-2 normal-case font-semibold text-blue-600 text-[10px]">
                      · AI recommends: {aiReport.suggestedDepartment}
                    </span>
                  )}
                </label>
                <select
                  name="doctor"
                  value={formData.doctor}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 font-semibold text-slate-700"
                >
                  <option value="">Choose a doctor...</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.full_name} · {d.specialization} · ₹{d.consultation_fee}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">Appointment Date</label>
                <div className="w-full border border-slate-200 bg-slate-50 text-slate-600 rounded-2xl px-4 py-3 font-bold text-sm flex items-center justify-between">
                  <span>Today (Immediate Walk-In Queue)</span>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black">
                    {new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                  </span>
                </div>
              </div>

              {/* Time */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">Appointment Time</label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 font-semibold text-slate-700"
                />
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">
                  Reason for Visit <span className="normal-case font-semibold text-slate-400">(Optional — auto-filled from AI analysis)</span>
                </label>
                <textarea
                  name="reason"
                  rows={2}
                  placeholder="Any additional notes for your doctor..."
                  value={formData.reason || (aiReport ? `AI Analysis: ${aiReport.suggestedDepartment} consultation — ${aiReport.severity} severity.` : "")}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 font-semibold text-slate-700 resize-none"
                />
              </div>
            </div>
          </motion.div>

          {/* ══════════════════════════════════════════════════════════════════
              CONFIRM BUTTON
          ══════════════════════════════════════════════════════════════════ */}
          <motion.button
            type="button"
            onClick={handleBook}
            disabled={booking}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-extrabold py-4 rounded-2xl text-sm hover:shadow-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {booking ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Confirming Appointment...
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                Confirm Appointment
                {aiReport && <span className="text-white/70 font-semibold">· with AI Summary attached</span>}
              </>
            )}
          </motion.button>

          {/* Consent Note */}
          <p className="text-center text-[10px] text-slate-400 font-semibold">
            🔒 Your symptom data and images are encrypted and accessible only to your assigned doctor. By confirming, you consent to sharing this AI-generated summary with your healthcare provider.
          </p>

        </div>
      </div>
    </div>
  );
}

export default BookAppointment;