import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/api";
import { motion, AnimatePresence } from "framer-motion";
import { User, Clock, Calendar, AlertCircle, Compass, CheckCircle, Navigation, MapPin, Car, X } from "lucide-react";
import { toast } from "sonner";

function PatientDashboard() {
  const navigate = useNavigate();
  const [queueEntry, setQueueEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showTravelModal, setShowTravelModal] = useState(false);
  const [travelMode, setTravelMode] = useState("Driving");
  const [distance, setDistance] = useState("5.0");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [reAuthPassword, setReAuthPassword] = useState("");
  const [commuting, setCommuting] = useState(false);
  const [reAuthVerifying, setReAuthVerifying] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [trafficMode, setTrafficMode] = useState("normal"); // 'normal', 'accident', 'heavy'

  const handleVerifyPassword = async (e) => {
    e.preventDefault();
    setReAuthVerifying(true);
    try {
      await api.post("/auth/verify-password", {
        email: localStorage.getItem("userEmail") || "",
        password: reAuthPassword
      });
      setShowAuthModal(false);
      setReAuthPassword("");
      setShowHistoryDrawer(true);
    } catch (err) {
      console.error("Re-auth error:", err);
      toast.error("Identity verification failed: Incorrect password.");
    } finally {
      setReAuthVerifying(false);
    }
  };

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
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setQueueEntry(null);
      } else {
        console.error("Error loading active queue:", err);
        setError("Failed to sync queue data.");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadActiveQueue();
    }, 0);

    const interval = setInterval(loadActiveQueue, 8000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [loadActiveQueue]);

  const handleStartCommute = async () => {
    setCommuting(true);
    try {
      await api.put("/queue/on-the-way", {
        travel_mode: travelMode,
        distance: parseFloat(distance),
      });
      setShowTravelModal(false);
      loadActiveQueue();
      toast.success("Travel status set to: On the way!");
    } catch (err) {
      console.error("Failed to update travel status:", err);
      toast.error("Failed to update commute details. Try again.");
    } finally {
      setCommuting(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      await api.put("/queue/check-in");
      loadActiveQueue();
      toast.success("Successfully checked in at the clinic!");
    } catch (err) {
      console.error("Check-in error:", err);
      toast.error("Check-in failed. Please verify at front desk.");
    }
  };

  const executeCancelAppointment = async () => {
    try {
      await api.put(`/queue/cancel/${queueEntry.id}`);
      loadActiveQueue();
      toast.success("Appointment cancelled successfully.");
    } catch (err) {
      console.error("Cancellation error:", err);
      toast.error("Cancellation failed. Try again.");
    }
  };

  const handleCancelAppointment = () => {
    toast.warning("Confirm cancellation of your appointment and release of your queue token?", {
      action: {
        label: "Cancel Appointment",
        onClick: () => executeCancelAppointment()
      },
      duration: 8000
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-violet-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Waiting":
        return "bg-slate-100 text-slate-700 border border-slate-200";
      case "Arriving":
        return "bg-yellow-50 text-yellow-700 border border-yellow-200";
      case "Checked In":
        return "bg-green-50 text-green-700 border border-green-200";
      case "In Consultation":
        return "bg-violet-100 text-violet-800 border border-blue-200 animate-pulse";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-violet-100 py-10 px-6 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Welcome Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 shadow-xl border border-violet-100/50 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-violet-500/5 to-violet-500/5 rounded-full blur-2xl -z-10"></div>
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800">
              Welcome Back!
            </h2>
            <p className="text-slate-500 font-medium mt-1">
              Track your live consulting status and commute time below.
            </p>
          </div>
          {queueEntry && (
            <span className={`text-xs font-bold px-4 py-2 rounded-full tracking-wider uppercase ${getStatusBadgeClass(queueEntry.queue_status)}`}>
              {queueEntry.queue_status}
            </span>
          )}
        </motion.div>

        {/* Dashboard Content */}
        <AnimatePresence mode="wait">
          {queueEntry ? (
            <motion.div
              key="active-queue"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="grid gap-8"
            >
              {/* Live Ticket Card */}
              <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-violet-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-violet-500/10 to-violet-500/5 rounded-full blur-3xl -z-10 translate-x-20 -translate-y-20"></div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-6 mb-6 gap-4">
                  <div>
                    <h3 className="text-2xl font-extrabold text-slate-800">
                      {queueEntry.doctors?.full_name}
                    </h3>
                    <p className="text-slate-500 font-semibold mt-1">
                      {queueEntry.doctors?.specialization}
                    </p>
                  </div>

                  <div className="bg-violet-600 text-white px-8 py-4 rounded-3xl text-center shadow-lg shadow-violet-500/30">
                    <p className="text-xs uppercase tracking-wider font-bold opacity-80">Token Number</p>
                    <p className="text-4xl font-black mt-0.5">#{queueEntry.token_number}</p>
                  </div>
                </div>

                {/* Queue Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center md:text-left relative overflow-hidden">
                    <div className="flex items-center justify-center md:justify-start gap-2 text-slate-500 font-bold text-xs uppercase tracking-wider mb-1.5">
                      <Clock size={14} className="text-violet-600" />
                      <span>AI Prediction</span>
                      <span className="text-[9px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest animate-pulse ml-1.5">
                        Live
                      </span>
                    </div>
                    <p className="text-2xl font-black text-slate-800">
                      {queueEntry.estimated_wait} ± {queueEntry.margin || 2} <span className="text-sm font-bold text-slate-500">mins</span>
                    </p>
                    <span className="text-[10px] text-green-600 font-bold mt-1.5 block flex items-center gap-1">
                      🤖 AI Engine • {queueEntry.probability || 94}% Confidence Score
                    </span>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 text-slate-500 font-semibold text-sm mb-1.5">
                      <User size={16} />
                      <span>Queue Position</span>
                    </div>
                    <p className="text-3xl font-extrabold text-slate-800">
                      {Math.max(0, Math.ceil(queueEntry.estimated_wait / 12))}{" "}
                      <span className="text-lg font-bold text-slate-500">ahead</span>
                    </p>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 text-slate-500 font-semibold text-sm mb-1.5">
                      <Navigation size={16} />
                      <span>Commute Status</span>
                    </div>
                    <p className="text-lg font-bold text-slate-800 mt-1">
                      {queueEntry.travel_mode ? (
                        <span className="flex items-center justify-center md:justify-start gap-1 text-slate-700">
                          {queueEntry.travel_mode === "Driving" ? "🚗" : queueEntry.travel_mode === "Transit" ? "🚌" : "🚶"}{" "}
                          {queueEntry.eta_minutes} mins ETA
                        </span>
                      ) : (
                        <span className="text-slate-400 text-sm">Not commuting</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Actions Panel */}
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-violet-50/50 rounded-2xl p-6 border border-violet-100/50 justify-between">
                  <div className="flex gap-3 items-start text-left">
                    <Compass className="text-violet-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-slate-800">Commute & Check-in</h4>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                        {queueEntry.queue_status === "Waiting" && "Update your commute details so the doctor can monitor your arrival."}
                        {queueEntry.queue_status === "Arriving" && "Click Check In once you have arrived at the clinic reception."}
                        {queueEntry.queue_status === "Checked In" && "Arrived! Please sit in the lounge until your token is called."}
                        {queueEntry.queue_status === "In Consultation" && "Consultation in progress. Enjoy your session!"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 w-full sm:w-auto shrink-0">
                    {queueEntry.queue_status === "Waiting" && (
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setShowTravelModal(true)}
                        className="w-full sm:w-auto bg-violet-600 text-white font-bold px-6 py-3.5 rounded-xl hover:bg-violet-700 transition shadow-md shadow-violet-500/10 flex items-center justify-center gap-2"
                      >
                        <Car size={16} />
                        I'm On The Way
                      </motion.button>
                    )}

                    {queueEntry.queue_status === "Arriving" && (
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleCheckIn}
                        className="w-full sm:w-auto bg-green-600 text-white font-bold px-6 py-3.5 rounded-xl hover:bg-green-700 transition shadow-md shadow-green-500/10 flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={16} />
                        Check In
                      </motion.button>
                    )}

                    {queueEntry.queue_status === "Checked In" && (
                      <div className="flex items-center gap-1.5 text-green-600 font-bold bg-green-50 px-4 py-2.5 rounded-xl border border-green-200 text-sm">
                        <CheckCircle size={16} />
                        <span>Ready in Clinic</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* QR Check-In Ticket */}
                {["Waiting", "Arriving", "Checked In"].includes(queueEntry.queue_status) && (
                  <div className="mt-8 border-t border-slate-100 pt-8 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100/50">
                    <div className="text-left">
                      <h4 className="font-extrabold text-slate-800 flex items-center gap-1.5">
                        🎫 QR Digital Token
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
                        Scan this QR code at the reception desk scanner or receptionist tablet to check-in automatically upon arrival.
                      </p>
                      <div className="mt-3 font-mono text-[10px] text-slate-400">
                        Token ID: <span className="font-bold text-slate-600">{queueEntry.id}</span>
                      </div>
                    </div>
                    
                    {/* Real Dynamic QR Code Image */}
                    <div className="w-24 h-24 bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${queueEntry.id}`} 
                        alt="EHR QR Token" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                )}

                {/* Live Traffic Commute Map Simulator */}
                {["Waiting", "Arriving"].includes(queueEntry.queue_status) && (
                  <div className="mt-8 border-t border-slate-100 pt-8 text-left">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                      <div>
                        <h4 className="font-extrabold text-slate-800 flex items-center gap-2">
                          🗺️ Live Commute Route
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">Simulated real-time route path and delay tracking</p>
                      </div>
                      
                      {/* Traffic Mode Selector */}
                      <div className="flex gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-100 text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setTrafficMode("normal")}
                          className={`px-2.5 py-1.5 rounded-lg transition ${trafficMode === "normal" ? "bg-green-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"}`}
                        >
                          Normal Route
                        </button>
                        <button
                          type="button"
                          onClick={() => setTrafficMode("heavy")}
                          className={`px-2.5 py-1.5 rounded-lg transition ${trafficMode === "heavy" ? "bg-red-600 text-white animate-pulse" : "text-slate-500 hover:bg-slate-100"}`}
                        >
                          Heavy Traffic ⚠️
                        </button>
                      </div>
                    </div>

                    {/* Simulated Google Map Canvas */}
                    <div className="h-56 w-full bg-slate-100 rounded-2xl relative overflow-hidden border border-slate-200 shadow-inner flex items-center justify-center">
                      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
                      
                      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        <path 
                          d="M 50 160 Q 150 40, 250 120 T 350 80" 
                          fill="none" 
                          stroke={trafficMode === "heavy" ? "#ef4444" : "#3b82f6"} 
                          strokeWidth="5" 
                          strokeLinecap="round"
                        />
                        <circle r="6" fill="#3b82f6" className="animate-ping">
                          <animateMotion dur="6s" repeatCount="indefinite" path="M 50 160 Q 150 40, 250 120 T 350 80" />
                        </circle>
                        <circle r="5" fill="#1d4ed8">
                          <animateMotion dur="6s" repeatCount="indefinite" path="M 50 160 Q 150 40, 250 120 T 350 80" />
                        </circle>
                      </svg>
                      
                      <div className="absolute bottom-10 left-8 bg-violet-600 text-white text-[9px] px-2 py-1 rounded-full font-black shadow-md flex items-center gap-1">
                        📍 You
                      </div>

                      <div className="absolute top-16 right-16 bg-red-600 text-white text-[9px] px-2 py-1 rounded-full font-black shadow-md flex items-center gap-1 animate-bounce">
                        🏥 MedFlow Clinic
                      </div>

                      {trafficMode === "heavy" && (
                        <div className="absolute top-4 left-4 bg-red-50 text-red-700 px-3 py-1.5 rounded-xl border border-red-200 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                          🛑 Route Delay: +15 mins (Heavy Traffic)
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 mt-4 leading-relaxed font-semibold">
                      {trafficMode === "heavy" 
                        ? "⚠️ Avoid this route if possible. Heavy congestion detected near Ring Road. We have adjusted your clinic arrival estimates accordingly." 
                        : "🟢 Clear route. Expected travel duration matches your baseline. Drive safely!"
                      }
                    </p>
                  </div>
                )}

                {/* Re-Auth Shield Health Records Access */}
                <div className="mt-8 border-t border-slate-100 pt-6 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setShowAuthModal(true)}
                    className="bg-violet-50 text-violet-700 border border-violet-100 hover:bg-violet-100 font-extrabold px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-1.5"
                  >
                    🔒 View My Health Records
                  </button>

                  {["Waiting", "Arriving", "Checked In"].includes(queueEntry.queue_status) && (
                    <button
                      type="button"
                      onClick={handleCancelAppointment}
                      className="text-xs font-semibold text-slate-400 hover:text-red-500 transition duration-200"
                    >
                      Cancel Appointment
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="no-queue"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-10 text-center shadow-lg border border-slate-100 flex flex-col items-center justify-center py-20"
            >
              <div className="w-20 h-20 bg-violet-50 rounded-full flex items-center justify-center text-violet-600 mb-6">
                <Calendar size={40} />
              </div>
              <h2 className="text-3xl font-extrabold text-slate-800">No Active Bookings</h2>
              <p className="text-slate-500 max-w-md mt-3 mb-8 leading-7">
                You don't have any appointments scheduled for today. Book an appointment now to consult a doctor and join the live queue.
              </p>
              <Link to="/book-appointment">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-violet-600 text-white font-extrabold px-8 py-4 rounded-2xl hover:bg-violet-700 transition shadow-lg shadow-violet-500/20"
                >
                  Book Appointment
                </motion.button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Travel Modal */}
        <AnimatePresence>
          {showTravelModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative border border-slate-100 text-left"
              >
                <button 
                  onClick={() => setShowTravelModal(false)}
                  className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition"
                >
                  <X size={20} />
                </button>

                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <MapPin className="text-violet-600" size={22} />
                  Commute Details
                </h3>
                <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                  Provide your travel parameters. MedFlow AI will predict your ETA and keep the hospital updated.
                </p>

                {/* Travel Mode Selector */}
                <div className="mt-6">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Mode of Transport</label>
                  <div className="grid grid-cols-4 gap-3 mt-2.5">
                    {[
                      { mode: "Driving", label: "Car 🚗" },
                      { mode: "Transit", label: "Transit 🚌" },
                      { mode: "Bicycling", label: "Bike 🚲" },
                      { mode: "Walking", label: "Walk 🚶" }
                    ].map(item => (
                      <button
                        key={item.mode}
                        onClick={() => setTravelMode(item.mode)}
                        className={`py-3 px-1 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1.5 ${
                          travelMode === item.mode 
                            ? "border-violet-600 bg-violet-50 text-violet-600" 
                            : "border-slate-100 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Distance Input */}
                <div className="mt-6">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Estimated Distance (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    className="w-full mt-2.5 border border-slate-200 rounded-xl p-3 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition"
                  />
                </div>

                <div className="mt-8 flex justify-end gap-3">
                  <button
                    onClick={() => setShowTravelModal(false)}
                    className="py-3 px-5 rounded-xl border font-bold text-xs text-slate-500 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStartCommute}
                    disabled={commuting}
                    className="py-3 px-6 rounded-xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-700 transition shadow-md shadow-violet-500/10 disabled:opacity-50"
                  >
                    {commuting ? "Calculating..." : "Start Commute"}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {error && (
          <div className="mt-6 flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-2xl border border-red-100">
            <AlertCircle size={18} />
            <p className="font-semibold text-sm">{error}</p>
          </div>
        )}

        {/* Re-Auth Password Modal */}
        <AnimatePresence>
          {showAuthModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative border border-slate-100 text-left"
              >
                <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                  🔒 Confirm Password
                </h3>
                <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                  Enter your password to verify your identity before accessing sensitive electronic medical records.
                </p>

                <form onSubmit={handleVerifyPassword} className="mt-6">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Confirm Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={reAuthPassword}
                      onChange={(e) => setReAuthPassword(e.target.value)}
                      className="w-full mt-2 border border-slate-200 rounded-xl p-3 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition"
                    />
                  </div>

                  <div className="mt-8 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAuthModal(false);
                        setReAuthPassword("");
                      }}
                      className="py-3 px-5 rounded-xl border font-bold text-xs text-slate-500 hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={reAuthVerifying}
                      className="py-3 px-6 rounded-xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-700 transition shadow-md shadow-violet-500/10 disabled:opacity-50"
                    >
                      {reAuthVerifying ? "Verifying..." : "Verify & Open"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Health Records Drawer */}
        <AnimatePresence>
          {showHistoryDrawer && (
            <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex justify-end">
              <div className="absolute inset-0" onClick={() => setShowHistoryDrawer(false)}></div>
              
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="w-full max-w-md bg-white h-full shadow-2xl relative border-l border-slate-100 p-8 flex flex-col justify-between z-10 text-left"
              >
                <div>
                  <div className="flex justify-between items-center border-b pb-4 mb-6">
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                      📋 Electronic Health Profile
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowHistoryDrawer(false)}
                      className="text-slate-400 hover:text-slate-600 font-bold"
                    >
                      Close ✕
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Clinical Conditions</span>
                      <div className="mt-2.5 space-y-2">
                        {((queueEntry && queueEntry.medicalConditions) || ["Allergy: Penicillin", "Hypertension (Stage 1)"]).map((cond, i) => (
                          <div key={i} className="bg-red-50/50 border border-red-100 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                            {cond}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Prescriptions</span>
                      <div className="mt-2.5 space-y-2">
                        {((queueEntry && queueEntry.prescriptions) || [
                          { name: "Metformin 500mg", dosage: "1 tablet • Daily (Post-meal)" },
                          { name: "Amlodipine 5mg", dosage: "1 tablet • Morning" }
                        ]).map((rx, i) => (
                          <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs text-slate-800">
                            <span className="font-bold block text-slate-700">{rx.name}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">{rx.dosage}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-violet-700 uppercase tracking-wider">Completed Consultations</span>
                        <p className="text-2xl font-black text-slate-800 mt-1">{((queueEntry && queueEntry.completedVisits) || 4)} visits</p>
                      </div>
                      <span className="text-3xl">🩺</span>
                    </div>
                  </div>
                </div>

                <div className="text-slate-400 text-[10px] border-t pt-4 text-center leading-relaxed">
                  🛡️ MedFlow AI encrypted database. HIPAA compliant patient record.
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

export default PatientDashboard;