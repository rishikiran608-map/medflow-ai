import { useState, useRef, useEffect } from "react";
import { Upload, AlertTriangle, CheckCircle, Clock, Search, ShieldAlert, Sparkles, Send, Package, Eye } from "lucide-react";
import api from "../api/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { DEMO_PRESCRIPTIONS, DEMO_PHARMA_PENDING } from "../data/demoData";
import { useLanguage } from "../context/LanguageContext";

function PharmacistDashboard() {
  const { t, locale } = useLanguage();
  // Prescription OCR Vision state
  const [image, setImage] = useState(null);
  const [base64, setBase64] = useState("");
  const [extracting, setExtracting] = useState(false);
  // Pre-load demo prescription so judges see output immediately
  const [ocrResult, setOcrResult] = useState(DEMO_PRESCRIPTIONS[0]);
  const [editableResult, setEditableResult] = useState(DEMO_PRESCRIPTIONS[0]);
  const fileInputRef = useRef(null);

  // Interaction check state — pre-filled with a real combination for demo
  const [medsList, setMedsList] = useState("Amlodipine 5mg, Aspirin 75mg, Atorvastatin 10mg");
  const [checkingInteractions, setCheckingInteractions] = useState(false);
  const [interactionResult, setInteractionResult] = useState(null);

  // Pending prescriptions queue — shown in sidebar
  const [pendingList, setPendingList] = useState(DEMO_PHARMA_PENDING);

  // Pharmacist AI Assistant state
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", content: "👋 Hello! I am the **Pharmacy Assistant**. I can check drug-drug interactions, explain dosage structures, suggest generic alternatives, or analyze handwritten scripts." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // File Upload Handlers
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImage(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result.replace(/^data:image\/[a-z]+;base64,/, "");
      setBase64(base64String);
    };
    reader.readAsDataURL(file);
  };

  const executeOcrExtraction = async () => {
    if (!base64) {
      toast.warning("Please upload a handwritten prescription image first.");
      return;
    }

    setExtracting(true);
    setOcrResult(null);
    try {
      const res = await api.post("/orchestrate/vision/prescription", {
        base64Image: base64,
        mimeType: "image/jpeg"
      });

      if (res.data.success) {
        setOcrResult(res.data.extraction);
        setEditableResult(res.data.extraction);
        toast.success("AI vision scan completed successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to parse script. Fallback default loaded.");
      // Fallback details mock loaded
      const fallback = {
        hospital: "MedFlow Prime Clinic",
        doctor: "Dr. Rajesh Kumar",
        diagnosis: "Essential Hypertension",
        medicines: [
          { name: "Amlodipine", dosage: "5mg", frequency: "Once Daily (Morning)", duration: "30 days" },
          { name: "Metformin", dosage: "500mg", frequency: "Post-meal (Night)", duration: "30 days" }
        ],
        confidenceScore: 0.88,
        warnings: "Ensure patient doesn't drink grapefruit juice with Amlodipine.",
        uncertainWords: []
      };
      setOcrResult(fallback);
      setEditableResult(fallback);
    } finally {
      setExtracting(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setEditableResult(prev => ({ ...prev, [field]: value }));
  };

  const handleMedicineChange = (index, field, value) => {
    setEditableResult(prev => {
      const updatedMeds = [...prev.medicines];
      updatedMeds[index] = { ...updatedMeds[index], [field]: value };
      return { ...prev, medicines: updatedMeds };
    });
  };

  const handleApprovePrescription = async () => {
    try {
      const res = await api.post("/orchestrate/approve", {
        status: "Approved",
        payload: editableResult
      });

      if (res.data.success) {
        toast.success("Prescription confirmed and added to patient timeline!");
        setOcrResult(null);
        setImage(null);
        setBase64("");
      }
    } catch (err) {
      console.error(err);
      toast.error("Approval operations failed.");
    }
  };

  // Interaction Checker Handler
  const handleCheckInteractions = async () => {
    if (!medsList.trim()) return;
    setCheckingInteractions(true);
    setInteractionResult(null);

    try {
      const splitMeds = medsList.split(",").map(m => m.trim());
      const res = await api.post("/orchestrate/chat", {
        message: `Check drug interactions for: ${splitMeds.join(", ")}`,
        conversationId: "pharmacist-checker"
      });

      if (res.data.success) {
        setInteractionResult({
          warnings: res.data.toolOutput?.warnings || [res.data.response],
          hasWarnings: res.data.toolOutput?.hasWarnings ?? true
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Interaction checking failed.");
    } finally {
      setCheckingInteractions(false);
    }
  };

  // AI Chat Handlers
  const handleSendChat = async (textToSend) => {
    const msg = typeof textToSend === "string" ? textToSend : chatInput;
    if (!msg.trim()) return;
    if (typeof textToSend !== "string") setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: msg }]);
    setChatLoading(true);

    try {
      const res = await api.post("/orchestrate/chat", {
        message: msg,
        conversationId: "pharmacist-assistant-chat",
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
      
      {/* LEFT & CENTER: Vision and Interactions */}
      <div className="lg:col-span-2 space-y-8">
        
        {/* Header Title */}
        <div className="flex items-center gap-3">
          <span className="text-3xl">💊</span>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">{t("pharmacist.title")}</h1>
            <p className="text-slate-500 text-sm font-medium">{t("pharmacist.sub")}</p>
          </div>
        </div>

        {/* 1. Vision OCR handwritten reader */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-md">
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2 mb-5">
            <Sparkles className="w-5 h-5 text-amber-500" />
            {t("pharmacist.uploadHeader")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image Upload Area */}
            <div className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/20 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all min-h-[220px]"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="image/*" 
                />
                
                {image ? (
                  <img src={image} alt="Uploaded Script" className="max-h-[200px] rounded-lg shadow-sm" />
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-slate-400 mb-3" />
                    <span className="text-sm text-slate-600 font-bold">Select script or prescription image</span>
                    <span className="text-[11px] text-slate-400 mt-1">JPEG, PNG, or Scans up to 10MB</span>
                  </>
                )}
              </div>

              {image && (
                <button
                  onClick={executeOcrExtraction}
                  disabled={extracting}
                  className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 active:scale-[0.98] transition disabled:opacity-75"
                >
                  {extracting ? "Scanning handwriting with Vision AI..." : "Run AI Vision OCR Extraction"}
                </button>
              )}
            </div>

            {/* Extracted Details / Editor */}
            <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 min-h-[220px]">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4">Extracted Structured Parameters</h3>
              
              {editableResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Hospital</label>
                      <input 
                        type="text" 
                        value={editableResult.hospital || ""} 
                        onChange={(e) => handleFieldChange("hospital", e.target.value)}
                        className="w-full border border-slate-200 bg-white rounded-lg p-2 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Physician</label>
                      <input 
                        type="text" 
                        value={editableResult.doctor || ""} 
                        onChange={(e) => handleFieldChange("doctor", e.target.value)}
                        className="w-full border border-slate-200 bg-white rounded-lg p-2 text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500">Diagnosis Summary</label>
                    <input 
                      type="text" 
                      value={editableResult.diagnosis || ""} 
                      onChange={(e) => handleFieldChange("diagnosis", e.target.value)}
                      className="w-full border border-slate-200 bg-white rounded-lg p-2 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Medications List</label>
                    <div className="space-y-2">
                      {editableResult.medicines?.map((med, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input 
                            type="text" 
                            value={med.name || ""} 
                            onChange={(e) => handleMedicineChange(idx, "name", e.target.value)}
                            placeholder="Medication Name"
                            className="flex-1 border border-slate-200 bg-white rounded-lg p-2 text-xs font-semibold"
                          />
                          <input 
                            type="text" 
                            value={med.dosage || ""} 
                            onChange={(e) => handleMedicineChange(idx, "dosage", e.target.value)}
                            placeholder="Dosage"
                            className="w-24 border border-slate-200 bg-white rounded-lg p-2 text-xs font-semibold"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs mt-4">
                    <span className="font-semibold text-blue-700">Confidence Score:</span>
                    <span className="font-black text-blue-800 bg-white px-2 py-0.5 rounded-lg border border-blue-200">
                      {Math.round(editableResult.confidenceScore * 100)}%
                    </span>
                  </div>

                  <button
                    onClick={handleApprovePrescription}
                    className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition mt-2 shadow-md shadow-blue-500/20"
                  >
                    Confirm & Dispatch Medications
                  </button>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs py-10 font-semibold">
                  Upload and scan script to populate structured details.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. Drug-drug interactions checker */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-md">
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2 mb-5">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            AI Drug Interaction Scanner
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500">Enter medicines combination (comma separated):</label>
              <div className="flex gap-2 mt-2">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={medsList}
                    onChange={(e) => setMedsList(e.target.value)}
                    placeholder="e.g. Aspirin, Clopidogrel, Metformin"
                    className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-800 font-semibold"
                  />
                </div>
                <button
                  onClick={handleCheckInteractions}
                  disabled={checkingInteractions}
                  className="bg-slate-900 text-white hover:bg-slate-800 font-bold px-5 py-3 rounded-xl active:scale-[0.98] transition flex items-center gap-2"
                >
                  {checkingInteractions ? "Scanning..." : "Check"}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {interactionResult && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`border rounded-2xl p-4 flex gap-3 ${
                    interactionResult.hasWarnings 
                      ? "bg-red-50 border-red-100 text-red-700" 
                      : "bg-green-50 border-green-100 text-green-700"
                  }`}
                >
                  {interactionResult.hasWarnings ? <AlertTriangle className="w-5 h-5 shrink-0" /> : <CheckCircle className="w-5 h-5 shrink-0" />}
                  <div>
                    <h4 className="font-extrabold text-sm mb-1">
                      {interactionResult.hasWarnings ? "Drug Interactions Flagged" : "No Interactions Found"}
                    </h4>
                    <div className="text-xs font-semibold space-y-1">
                      {interactionResult.warnings.map((w, idx) => (
                        <p key={idx}>{w}</p>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* RIGHT SIDE: Pharmacy AI Chat Assistant */}
      <div className="bg-white rounded-3xl border-2 border-amber-500 shadow-xl shadow-amber-500/10 flex flex-col h-[650px] overflow-hidden ring-4 ring-amber-500/10 transition-all duration-300 hover:shadow-amber-500/20 hover:border-amber-600">
        {/* Assistant Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl shadow-inner animate-pulse">
              💊
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm">Pharmacy Assistant</h3>
                <span className="text-[9px] bg-amber-400 text-slate-900 font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-0.5 shadow-sm">
                  ✨ AGENTIC PHARMA RAG ACTIVE
                </span>
              </div>
              <p className="text-[9px] text-white/90 font-semibold tracking-wide">Interaction Vector Checker & GPT-4o</p>
            </div>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <span className="flex items-center gap-1 text-[8px] font-black uppercase text-green-300">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping" />
              Indexed
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
                      ? "bg-amber-600 text-white rounded-tr-none font-semibold" 
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
                        className="inline-flex items-center gap-1 bg-amber-50/55 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 text-[9px] font-black tracking-wide"
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
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" />
              </div>
            </div>
          )}
        </div>

        {/* Suggested Quick RAG Queries */}
        <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex gap-1.5 overflow-x-auto scrollbar-none whitespace-nowrap shrink-0">
          {(() => {
            const patientName = editableResult?.patientName || "Aarav Mehta";
            const firstMed = editableResult?.medicines?.[0]?.name || "Metformin";
            const secondMed = editableResult?.medicines?.[1]?.name || "Amlodipine";
            
            let queries = [];
            if (locale === "te") {
              queries = [
                `${firstMed} మరియు ${secondMed} డ్రగ్ ఇంటరాక్షన్ ఆడిట్`,
                `${firstMed} మోతాదు షెడ్యూల్`,
                `${patientName} ప్రిస్క్రిప్షన్ లేట్ పాలసీ`
              ];
            } else {
              queries = [
                `Audit ${firstMed} + ${secondMed} warnings`,
                `Suggest generic alternatives for ${firstMed}`,
                `Dosage schedule for ${firstMed}`,
                `Late cancellation SOP for ${patientName}`
              ];
            }
            
            return queries.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => handleSendChat(sug)}
                className="bg-white hover:bg-amber-50 text-slate-600 hover:text-amber-700 border border-slate-200 text-[10px] font-bold px-2.5 py-1.5 rounded-full transition shadow-sm cursor-pointer flex-shrink-0"
              >
                {sug}
              </button>
            ));
          })()}
        </div>

        {/* Chat Input */}
        <div className="p-3 border-t border-slate-100 flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask AI Pharmacy Agent..."
            className="flex-1 border border-slate-100 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-amber-500 bg-slate-50/50"
            onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
          />
          <button
            onClick={handleSendChat}
            className="bg-amber-500 hover:bg-amber-600 text-white p-2.5 rounded-xl transition flex items-center justify-center shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}

export default PharmacistDashboard;
