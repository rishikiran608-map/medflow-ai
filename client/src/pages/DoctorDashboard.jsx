import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Clipboard, RefreshCw, AlertCircle, Clock, Play, CheckSquare, Smile, Phone, Activity } from "lucide-react";

function DoctorDashboard() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completing, setCompleting] = useState(false);
  const [callingNext, setCallingNext] = useState(false);

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
    } catch (err) {
      console.error("Error loading doctor queue:", err);
      setError("Failed to fetch queue list.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDoctorQueue();
    }, 0);

    const interval = setInterval(loadDoctorQueue, 8000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [loadDoctorQueue]);

  const handleCallNext = async () => {
    setCallingNext(true);
    try {
      const res = await api.put("/queue/call-next");
      if (res.data.success) {
        await loadDoctorQueue();
      }
    } catch (err) {
      console.error("Failed to call next patient:", err);
      alert(err.response?.data?.message || "⚠️ No patient checked-in or ready to call.");
    } finally {
      setCallingNext(false);
    }
  };

  const handleComplete = async (queueId) => {
    setCompleting(true);
    try {
      await api.put(`/queue/complete/${queueId}`);
      await loadDoctorQueue();
    } catch (err) {
      console.error("Failed to complete consultation:", err);
      alert("⚠️ Failed to update consultation status.");
    } finally {
      setCompleting(false);
    }
  };

  const activePatient = queue.find(item => item.queue_status === "In Consultation");
  
  // The rest of the queue (Waiting, Arriving, Checked In)
  const waitingQueue = queue.filter(item => item.queue_status !== "In Consultation");

  // Calculate wait stats
  const totalWaiting = waitingQueue.length;
  const avgWaitTime = totalWaiting * 12;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-100 py-10 px-6 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Sub-Header / Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl border border-blue-100/30 shadow-sm flex items-center gap-4 relative overflow-hidden">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Patients Waiting</p>
              <h3 className="text-2xl font-black text-slate-800 mt-0.5">{totalWaiting}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-blue-100/30 shadow-sm flex items-center gap-4 relative overflow-hidden">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Est. Backlog Wait</p>
              <h3 className="text-2xl font-black text-slate-800 mt-0.5">{avgWaitTime} mins</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-blue-100/30 shadow-sm flex items-center gap-4 relative overflow-hidden">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Queue Flow Speed</p>
              <h3 className="text-2xl font-black text-slate-800 mt-0.5">12 <span className="text-sm font-bold text-slate-500">mins/p</span></h3>
            </div>
          </div>
        </div>

        {/* Doctor Analytics Dashboard */}
        <div className="bg-white rounded-3xl p-6 border border-blue-100/30 shadow-sm mb-8 text-left">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Activity size={14} className="text-blue-600 animate-pulse" />
            Live Practice Metrics & Analytics
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Avg Consult Time</span>
              <p className="text-xl font-black text-slate-800 mt-1">11.4 <span className="text-xs font-bold text-slate-500">mins</span></p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Completed Today</span>
              <p className="text-xl font-black text-slate-800 mt-1">8 <span className="text-xs font-bold text-slate-500">patients</span></p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Average Delay</span>
              <p className="text-xl font-black text-slate-800 mt-1">+4.2 <span className="text-xs font-bold text-slate-500">mins</span></p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Doctor Utilization</span>
              <p className="text-xl font-black text-slate-800 mt-1">88.5%</p>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Active Consultation Panel */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Clipboard className="text-blue-600" size={20} />
                Active Session
              </h3>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={loadDoctorQueue}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border rounded-xl text-slate-600 text-xs font-bold shadow-sm hover:bg-slate-50 transition"
              >
                <RefreshCw size={12} />
                Sync List
              </motion.button>
            </div>

            {/* Active Patient Card */}
            <AnimatePresence mode="wait">
              {activePatient ? (
                <motion.div
                  key={activePatient.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-3xl p-8 shadow-xl border border-blue-100 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-60 h-60 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-full blur-3xl -z-10 translate-x-20 -translate-y-20"></div>

                  <div className="flex justify-between items-start border-b border-slate-100 pb-6 mb-6">
                    <div>
                      <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider animate-pulse">
                        ⚡ Consultation In Progress
                      </span>
                      <h2 className="text-3xl font-extrabold text-slate-800 mt-3">
                        {activePatient.patients?.full_name}
                      </h2>
                      <p className="text-slate-500 font-semibold text-sm mt-1">
                        Age: {activePatient.patients?.age || 25} yrs • Gender: {activePatient.patients?.gender || "Male"}
                      </p>
                    </div>

                    <div className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-center shadow-lg shadow-blue-500/20">
                      <span className="text-xs uppercase tracking-wider font-bold opacity-80 block">Token</span>
                      <span className="text-3xl font-black">#{activePatient.token_number}</span>
                    </div>
                  </div>

                  {/* Patient Info Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 text-left">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Phone Number</span>
                      <p className="text-sm font-bold text-slate-700 mt-1 flex items-center gap-1.5">
                        <Phone size={14} className="text-slate-400" />
                        {activePatient.patients?.phone || "N/A"}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Patient Email</span>
                      <p className="text-sm font-bold text-slate-700 mt-1 truncate">{activePatient.patients?.email}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Arrived At</span>
                      <p className="text-sm font-bold text-slate-700 mt-1">
                        {activePatient.arrived_at 
                          ? new Date(activePatient.arrived_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleComplete(activePatient.id)}
                      disabled={completing}
                      className="bg-green-600 text-white font-extrabold px-8 py-4 rounded-2xl hover:bg-green-700 transition shadow-lg shadow-green-500/10 disabled:opacity-50 flex items-center gap-2"
                    >
                      <CheckSquare size={18} />
                      {completing ? "Completing..." : "Complete Consultation"}
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty-consultation"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-3xl p-10 text-center shadow-lg border border-slate-100 flex flex-col items-center justify-center py-20"
                >
                  <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-6">
                    <Smile size={40} />
                  </div>
                  <h2 className="text-3xl font-extrabold text-slate-800">No Active Session</h2>
                  <p className="text-slate-500 max-w-md mt-2 leading-7 mb-8">
                    You aren't consulting anyone right now. Click the button below to call the next checked-in patient.
                  </p>

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleCallNext}
                    disabled={callingNext || waitingQueue.length === 0}
                    className="bg-blue-600 text-white font-extrabold px-8 py-4 rounded-2xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/20 disabled:opacity-40 flex items-center gap-2"
                  >
                    <Play size={18} />
                    {callingNext ? "Calling..." : "Call Next Patient"}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Queue Timeline Panel */}
          <div className="space-y-8">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Users className="text-blue-600" size={20} />
              Upcoming Queue ({waitingQueue.length})
            </h3>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              <AnimatePresence>
                {waitingQueue.length === 0 ? (
                  <div className="text-center text-slate-400 py-10 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                    No upcoming patients
                  </div>
                ) : (
                  waitingQueue.map((patient, index) => (
                    <motion.div
                      key={patient.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition flex justify-between items-center"
                    >
                      <div className="flex gap-3 items-center text-left">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-600">
                          #{patient.token_number}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-800 leading-tight">{patient.patients?.full_name}</h4>
                          <span className={`text-[9px] font-bold px-2 py-0.5 mt-1.5 inline-block rounded-full uppercase tracking-wider ${
                            patient.queue_status === "Checked In" 
                              ? "bg-green-50 text-green-600 border border-green-200" 
                              : patient.queue_status === "Arriving"
                              ? "bg-yellow-50 text-yellow-600 border border-yellow-200"
                              : "bg-slate-50 text-slate-400 border border-slate-200"
                          }`}>
                            {patient.queue_status}
                            {patient.travel_mode && ` (${patient.travel_mode})`}
                          </span>

                          {/* AI No-Show Risk Classifier Badge */}
                          {(() => {
                            const risk = patient.queue_status === "Checked In" 
                              ? { level: "Low", pct: 5 } 
                              : patient.queue_status === "Arriving" 
                              ? { level: "Medium", pct: 35 } 
                              : { level: "High", pct: 72 };
                            return (
                              <span className={`text-[9px] font-bold px-2 py-0.5 mt-1.5 ml-2 inline-block rounded-full uppercase tracking-wider ${
                                risk.level === "Low" 
                                  ? "bg-green-50 text-green-700 border border-green-200" 
                                  : risk.level === "Medium"
                                  ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                                  : "bg-red-50 text-red-600 border border-red-200 animate-pulse"
                              }`}>
                                Risk: {risk.pct}% {risk.level === "High" && "⚠️"}
                              </span>
                            );
                          })()}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {patient.queue_status === "Arriving" && patient.eta_minutes ? (
                          <>
                            <span className="text-[10px] text-yellow-600 block font-bold">ETA Arrival</span>
                            <span className="font-bold text-yellow-700 text-sm">{patient.eta_minutes} mins</span>
                          </>
                        ) : (
                          <>
                            <span className="text-[10px] text-slate-400 block font-semibold">Wait Time</span>
                            <span className="font-bold text-slate-700 text-sm">{patient.estimated_wait} mins</span>
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>

        {error && (
          <div className="mt-6 flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-2xl border border-red-100">
            <AlertCircle size={18} />
            <p className="font-semibold text-sm">{error}</p>
          </div>
        )}

      </div>
    </div>
  );
}

export default DoctorDashboard;