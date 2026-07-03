import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, Users, Award, UsersRound, Timer, ShieldAlert, BarChart3 } from "lucide-react";
import { getPatients } from "../services/patientService";
import { getDoctors } from "../services/doctorService";
import { getQueue } from "../services/queueService";

function AdminDashboard() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const patientsData = await getPatients();
      const doctorsData = await getDoctors();
      const queueData = await getQueue();

      setPatients(patientsData);
      setDoctors(doctorsData);
      setQueue(queueData);
      setError("");
    } catch (err) {
      console.error("Error fetching admin stats:", err);
      setError("Failed to synchronize administrative dashboard records.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    const interval = setInterval(loadData, 10000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [loadData]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  const averageWait =
    queue.length > 0
      ? Math.round(
          queue.reduce((sum, item) => sum + (item.estimated_wait || 0), 0) / queue.length
        )
      : 0;

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
              🏥
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-800">MedFlow AI</h1>
              <p className="text-xs font-semibold text-blue-600 tracking-wider uppercase">Hospital Admin Portal</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-50 text-red-600 px-5 py-3 rounded-2xl font-semibold hover:bg-red-100 transition duration-300"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Patients</p>
              <h3 className="text-2xl font-black text-slate-800 mt-0.5">{patients.length}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center">
              <Award size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Doctors</p>
              <h3 className="text-2xl font-black text-slate-800 mt-0.5">{doctors.length}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center">
              <UsersRound size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">In Queue</p>
              <h3 className="text-2xl font-black text-slate-800 mt-0.5">{queue.length}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center">
              <Timer size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Wait</p>
              <h3 className="text-2xl font-black text-slate-800 mt-0.5">{averageWait} mins</h3>
            </div>
          </div>
        </div>

        {/* Live Queue Table */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden p-8">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <BarChart3 className="text-blue-600" size={20} />
            Live Queue Monitor
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-4">Token</th>
                  <th className="pb-4">Patient ID</th>
                  <th className="pb-4">Doctor ID</th>
                  <th className="pb-4">Est. Wait</th>
                  <th className="pb-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {queue.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-10 text-center text-slate-400">
                      No patients currently waiting in queue.
                    </td>
                  </tr>
                ) : (
                  queue.map((item) => (
                    <tr key={item.id} className="border-b border-slate-50 last:border-0 text-sm font-semibold text-slate-700">
                      <td className="py-4">
                        <span className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-600">
                          #{item.token_number}
                        </span>
                      </td>
                      <td className="py-4 font-mono text-xs">{item.patient_id.substring(0, 8)}...</td>
                      <td className="py-4 font-mono text-xs">{item.doctor_id.substring(0, 8)}...</td>
                      <td className="py-4">{item.estimated_wait} mins</td>
                      <td className="py-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          item.queue_status === "On The Way"
                            ? "bg-green-50 text-green-600 border border-green-200"
                            : "bg-yellow-50 text-yellow-600 border border-yellow-200"
                        }`}>
                          {item.queue_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {error && (
          <div className="mt-6 flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-2xl border border-red-100">
            <ShieldAlert size={18} />
            <p className="font-semibold text-sm">{error}</p>
          </div>
        )}

      </div>
    </div>
  );
}

export default AdminDashboard;