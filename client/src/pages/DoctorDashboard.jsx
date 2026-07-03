import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Users, Clipboard, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";

function DoctorDashboard() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completing, setCompleting] = useState(false);

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

    // Auto-refresh every 10 seconds
    const interval = setInterval(loadDoctorQueue, 10000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [loadDoctorQueue]);

  const handleComplete = async (queueId) => {
    setCompleting(true);
    try {
      await api.put(`/queue/complete/${queueId}`);
      // Reload queue
      await loadDoctorQueue();
    } catch (err) {
      console.error("Failed to complete consultation:", err);
      alert("⚠️ Failed to update consultation status.");
    } finally {
      setCompleting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  const currentPatient = queue[0];
  const upcomingPatients = queue.slice(1);

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
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-10 bg-white/60 backdrop-blur-md px-8 py-5 rounded-3xl shadow-sm border border-white"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-blue-500/20">
              🩺
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-800">MedFlow AI</h1>
              <p className="text-xs font-semibold text-blue-600 tracking-wider uppercase">Doctor Panel</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={loadDoctorQueue}
              className="p-3 bg-white hover:bg-slate-50 border rounded-2xl text-slate-600 transition"
              title="Refresh Queue"
            >
              <RefreshCw size={18} />
            </motion.button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-50 text-red-600 px-5 py-3 rounded-2xl font-semibold hover:bg-red-100 transition duration-300"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </motion.div>

        {/* Dashboard Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Active Consultation Panel */}
          <div className="lg:col-span-2 space-y-8">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Clipboard className="text-blue-600" size={20} />
              Active Consultation
            </h3>

            <AnimatePresence mode="wait">
              {currentPatient ? (
                <motion.div
                  key={currentPatient.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="bg-white rounded-3xl p-8 shadow-xl border border-blue-100 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-60 h-60 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-full blur-3xl -z-10 translate-x-20 -translate-y-20"></div>

                  <div className="flex justify-between items-start border-b border-gray-100 pb-6 mb-6">
                    <div>
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${
                        currentPatient.queue_status === "On The Way" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {currentPatient.queue_status === "On The Way" ? "🟢 On The Way" : "⏱️ Waiting"}
                      </span>
                      <h2 className="text-3xl font-extrabold text-slate-800 mt-3">
                        {currentPatient.patients?.full_name}
                      </h2>
                      <p className="text-slate-500 font-medium mt-1">
                        Patient Profile details
                      </p>
                    </div>

                    <div className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-center shadow-lg shadow-blue-600/20">
                      <span className="text-xs uppercase tracking-wider font-semibold opacity-80 block">Token</span>
                      <span className="text-3xl font-black">#{currentPatient.token_number}</span>
                    </div>
                  </div>

                  {/* Patient Info Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Age</span>
                      <p className="text-xl font-bold text-slate-800 mt-1">{currentPatient.patients?.age || 25} yrs</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Gender</span>
                      <p className="text-xl font-bold text-slate-800 mt-1">{currentPatient.patients?.gender || "Male"}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Phone</span>
                      <p className="text-sm font-bold text-slate-800 mt-2">{currentPatient.patients?.phone || "N/A"}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Wait Time</span>
                      <p className="text-xl font-bold text-slate-800 mt-1">{currentPatient.estimated_wait} mins</p>
                    </div>
                  </div>

                  {/* Consultation Actions */}
                  <div className="flex justify-end gap-4 border-t border-gray-100 pt-6">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleComplete(currentPatient.id)}
                      disabled={completing}
                      className="bg-blue-600 text-white font-extrabold px-8 py-4 rounded-2xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2"
                    >
                      {completing ? "Updating..." : "Complete Consultation"}
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
                    <CheckCircle2 size={40} />
                  </div>
                  <h2 className="text-3xl font-extrabold text-slate-800">Queue is Empty</h2>
                  <p className="text-slate-500 max-w-md mt-2 leading-7">
                    Excellent! All patient appointments for today have been completed. Enjoy your break!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Queue Timeline Panel */}
          <div className="space-y-8">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Users className="text-blue-600" size={20} />
              Upcoming Patients ({upcomingPatients.length})
            </h3>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              <AnimatePresence>
                {upcomingPatients.length === 0 ? (
                  <div className="text-center text-slate-400 py-10 bg-slate-50/50 rounded-2xl border border-dashed">
                    No upcoming patients
                  </div>
                ) : (
                  upcomingPatients.map((patient, index) => (
                    <motion.div
                      key={patient.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition flex justify-between items-center"
                    >
                      <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-600">
                          #{patient.token_number}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-800">{patient.patients?.full_name}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 mt-1 inline-block rounded-full uppercase tracking-wider ${
                            patient.queue_status === "On The Way" 
                              ? "bg-green-50 text-green-600 border border-green-200" 
                              : "bg-slate-50 text-slate-500 border border-slate-200"
                          }`}>
                            {patient.queue_status === "On The Way" ? "On The Way" : "Waiting"}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-400 block font-semibold">Wait Time</span>
                        <span className="font-bold text-slate-700">{patient.estimated_wait} mins</span>
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