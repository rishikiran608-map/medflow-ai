import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/api";
import { motion, AnimatePresence } from "framer-motion";
import { User, LogOut, Clock, Calendar, AlertCircle, Compass, CheckCircle } from "lucide-react";

function PatientDashboard() {
  const navigate = useNavigate();
  const [queueEntry, setQueueEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

    // Auto-refresh queue entry every 10 seconds to keep live wait time updated
    const interval = setInterval(loadActiveQueue, 10000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [loadActiveQueue]);

  const handleOnTheWay = async () => {
    try {
      await api.put("/queue/on-the-way");
      // Refresh details
      loadActiveQueue();
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("⚠️ Failed to update your status. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/login");
  };

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
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-10 bg-white/60 backdrop-blur-md px-8 py-5 rounded-3xl shadow-sm border border-white"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-blue-500/20">
              M
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-800">MedFlow AI</h1>
              <p className="text-xs font-semibold text-blue-600 tracking-wider uppercase">Patient Portal</p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-50 text-red-600 px-5 py-3 rounded-2xl font-semibold hover:bg-red-100 transition duration-300"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </motion.div>

        {/* Dashboard Content */}
        <AnimatePresence mode="wait">
          {queueEntry ? (
            <motion.div
              key="active-queue"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.5 }}
              className="grid gap-8"
            >
              {/* Main Ticket Card */}
              <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-blue-100 relative overflow-hidden">
                {/* Background Accent Gradients */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 rounded-full blur-3xl -z-10 translate-x-20 -translate-y-20"></div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-6 mb-6 gap-4">
                  <div>
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                      {queueEntry.queue_status === "Waiting" ? "🔴 In Queue" : "🟢 On My Way"}
                    </span>
                    <h2 className="text-3xl font-extrabold text-gray-800 mt-3">
                      {queueEntry.doctors?.full_name}
                    </h2>
                    <p className="text-gray-500 font-medium mt-1">
                      {queueEntry.doctors?.specialization}
                    </p>
                  </div>

                  <div className="bg-blue-600 text-white px-8 py-4 rounded-3xl text-center shadow-lg shadow-blue-600/30">
                    <p className="text-xs uppercase tracking-wider font-semibold opacity-80">Token Number</p>
                    <p className="text-4xl font-black mt-1">#{queueEntry.token_number}</p>
                  </div>
                </div>

                {/* Queue Stats Grid */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-slate-500 font-medium text-sm mb-2">
                      <Clock size={16} />
                      <span>Estimated Wait</span>
                    </div>
                    <p className="text-3xl font-extrabold text-slate-800">
                      {queueEntry.estimated_wait} <span className="text-lg font-bold">mins</span>
                    </p>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-slate-500 font-medium text-sm mb-2">
                      <User size={16} />
                      <span>Queue Position</span>
                    </div>
                    <p className="text-3xl font-extrabold text-slate-800">
                      {Math.max(0, Math.ceil(queueEntry.estimated_wait / 12))}{" "}
                      <span className="text-lg font-bold">ahead</span>
                    </p>
                  </div>
                </div>

                {/* Action Section */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-blue-50/50 rounded-2xl p-6 border border-blue-100/50">
                  <div className="flex gap-3 items-start">
                    <Compass className="text-blue-600 shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-slate-800">Check-in Status</h4>
                      <p className="text-sm text-slate-600 mt-0.5">
                        {queueEntry.queue_status === "Waiting"
                          ? "Let the doctor know you are heading to the clinic."
                          : "Doctor is notified. Please wait in the waiting room."}
                      </p>
                    </div>
                  </div>

                  {queueEntry.queue_status === "Waiting" && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleOnTheWay}
                      className="w-full sm:w-auto bg-blue-600 text-white font-bold px-8 py-4 rounded-2xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/20"
                    >
                      I'm On The Way
                    </motion.button>
                  )}

                  {queueEntry.queue_status === "On The Way" && (
                    <div className="flex items-center gap-2 text-green-600 font-bold bg-green-50 px-5 py-3 rounded-2xl border border-green-200">
                      <CheckCircle size={18} />
                      <span>On The Way Checked</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="no-queue"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-10 text-center shadow-lg border border-slate-100 flex flex-col items-center justify-center"
            >
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-6">
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
                  className="bg-blue-600 text-white font-extrabold px-8 py-4 rounded-2xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/20"
                >
                  Book Appointment
                </motion.button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

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

export default PatientDashboard;