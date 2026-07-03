import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Award, UsersRound, Timer, ShieldAlert, BarChart3, Activity } from "lucide-react";
import { getPatients } from "../services/patientService";
import { getDoctors } from "../services/doctorService";
import { getQueue } from "../services/queueService";
import api from "../api/api";

function AdminDashboard() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("monitor"); // 'monitor', 'analytics', 'doctors', 'patients'
  const [seeding, setSeeding] = useState(false);

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

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      await api.post("/queue/seed-demo");
      alert("⚡ Live showcase demo data seeded successfully!");
      await loadData();
    } catch (err) {
      console.error("Failed to seed demo data:", err);
      alert("⚠️ Seeding failed: " + (err.response?.data?.message || err.message));
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    const interval = setInterval(loadData, 8000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [loadData]);

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

  const getStatusBadge = (status) => {
    switch (status) {
      case "Waiting":
        return "bg-slate-100 text-slate-700 border border-slate-200";
      case "On The Way":
      case "Arriving":
        return "bg-yellow-50 text-yellow-700 border border-yellow-200";
      case "Checked In":
        return "bg-green-50 text-green-700 border border-green-200";
      case "In Consultation":
        return "bg-blue-50 text-blue-700 border border-blue-200 animate-pulse";
      case "Completed":
        return "bg-slate-50 text-slate-400 border border-slate-100";
      case "Cancelled":
      case "No Show":
        return "bg-red-50 text-red-600 border border-red-100";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-100 py-10 px-6 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Hospital Administration Console</h2>
            <p className="text-xs font-semibold text-slate-400 mt-1">Live queue operations monitoring, directories, and analytical insights.</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSeedData}
            disabled={seeding}
            className="w-full sm:w-auto bg-blue-600 text-white font-extrabold px-5 py-3 rounded-xl hover:bg-blue-700 transition shadow-md shadow-blue-500/10 text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            ⚡ {seeding ? "Seeding..." : "Seed Showcase Data"}
          </motion.button>
        </div>

        {/* Sub-Header / Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Patients</p>
              <h3 className="text-2xl font-black text-slate-800 mt-0.5">{patients.length}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center">
              <Award size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Doctors</p>
              <h3 className="text-2xl font-black text-slate-800 mt-0.5">{doctors.length}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center">
              <UsersRound size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Queue</p>
              <h3 className="text-2xl font-black text-slate-800 mt-0.5">
                {queue.filter(q => ["Waiting", "Arriving", "Checked In", "In Consultation"].includes(q.queue_status)).length}
              </h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center">
              <Timer size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Wait Time</p>
              <h3 className="text-2xl font-black text-slate-800 mt-0.5">{averageWait} mins</h3>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 mb-8 gap-4 overflow-x-auto pb-1">
          {[
            { id: "monitor", label: "Live Queue Monitor", icon: BarChart3 },
            { id: "analytics", label: "SaaS Analytics", icon: Activity },
            { id: "doctors", label: "Doctors Directory", icon: Award },
            { id: "patients", label: "Registered Patients", icon: Users }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-4 font-bold text-sm border-b-2 transition whitespace-nowrap px-1 ${
                  activeTab === tab.id 
                    ? "border-blue-600 text-blue-600" 
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden p-8">
          
          {/* TAB 1: Live Queue Monitor */}
          {activeTab === "monitor" && (
            <div>
              <h3 className="text-lg font-extrabold text-slate-800 mb-6 flex items-center gap-2">
                <BarChart3 className="text-blue-600" size={20} />
                Real-Time Queue Dispatcher
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <th className="pb-4">Token</th>
                      <th className="pb-4">Patient ID</th>
                      <th className="pb-4">Doctor ID</th>
                      <th className="pb-4">Est. Wait</th>
                      <th className="pb-4">Commute Mode</th>
                      <th className="pb-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queue.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-10 text-center text-slate-400">
                          No patients in clinic queue today.
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
                          <td className="py-4 font-mono text-xs text-slate-400">{item.patient_id.substring(0, 8)}...</td>
                          <td className="py-4 font-mono text-xs text-slate-400">{item.doctor_id.substring(0, 8)}...</td>
                          <td className="py-4">{item.estimated_wait} mins</td>
                          <td className="py-4 text-slate-500">
                            {item.travel_mode ? (
                              <span className="flex items-center gap-1">
                                {item.travel_mode === "Driving" ? "🚗" : item.travel_mode === "Transit" ? "🚌" : "🚶"}{" "}
                                {item.travel_mode} ({item.eta_minutes}m ETA)
                              </span>
                            ) : (
                              "N/A"
                            )}
                          </td>
                          <td className="py-4">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${getStatusBadge(item.queue_status)}`}>
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
          )}

          {/* TAB 2: SaaS Analytics */}
          {activeTab === "analytics" && (
            <div className="space-y-8 text-left">
              <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                <Activity className="text-blue-600" size={20} />
                SaaS Analytical Performance Indicators
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Doctor Efficiency Score</span>
                  <p className="text-3xl font-black text-slate-800 mt-2">94.8%</p>
                  <p className="text-xs text-green-600 font-semibold mt-1">▲ 1.2% this week</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Average Patient Stay Duration</span>
                  <p className="text-3xl font-black text-slate-800 mt-2">26.4 mins</p>
                  <p className="text-xs text-green-600 font-semibold mt-1">▼ 3.8 mins optimized by AI</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">No-Show / Cancellation Rate</span>
                  <p className="text-3xl font-black text-slate-800 mt-2">4.2%</p>
                  <p className="text-xs text-green-600 font-semibold mt-1">▼ 8.1% reduced via auto-alerts</p>
                </div>
              </div>

              {/* Extra analytic graphs simulated */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h4 className="font-bold text-slate-800 mb-4">Clinic Congestion Heatmap (24 Hours)</h4>
                <div className="flex items-end gap-1.5 h-36 pt-4 px-2">
                  {[20, 25, 10, 5, 8, 30, 60, 95, 80, 55, 40, 75, 90, 85, 30, 25, 15, 10, 45, 65, 85, 50, 30, 15].map((val, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <div 
                        style={{ height: `${val}%` }} 
                        className={`w-full rounded-t-sm transition duration-500 ${
                          val > 80 ? "bg-red-500" : val > 50 ? "bg-yellow-400" : "bg-blue-500"
                        }`}
                      ></div>
                      <span className="text-[8px] font-bold text-slate-400">{idx}:00</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Doctors Directory */}
          {activeTab === "doctors" && (
            <div>
              <h3 className="text-lg font-extrabold text-slate-800 mb-6 flex items-center gap-2">
                <Award className="text-blue-600" size={20} />
                Exposed Medical Staff Directory
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <th className="pb-4">Name</th>
                      <th className="pb-4">Specialization</th>
                      <th className="pb-4">Qualification</th>
                      <th className="pb-4">Consultation Fee</th>
                      <th className="pb-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.map((doctor) => (
                      <tr key={doctor.id} className="border-b border-slate-50 last:border-0 text-sm font-semibold text-slate-700">
                        <td className="py-4 font-bold text-slate-800">{doctor.full_name}</td>
                        <td className="py-4 text-slate-600">{doctor.specialization}</td>
                        <td className="py-4 text-slate-500">{doctor.qualification}</td>
                        <td className="py-4 text-slate-800">₹{doctor.consultation_fee}</td>
                        <td className="py-4">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            doctor.available ? "bg-green-50 text-green-700 border border-green-200" : "bg-slate-50 text-slate-400"
                          }`}>
                            {doctor.available ? "Available" : "On Leave"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Registered Patients */}
          {activeTab === "patients" && (
            <div>
              <h3 className="text-lg font-extrabold text-slate-800 mb-6 flex items-center gap-2">
                <Users className="text-blue-600" size={20} />
                Registered Patients Log
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <th className="pb-4">Name</th>
                      <th className="pb-4">Email</th>
                      <th className="pb-4">Phone</th>
                      <th className="pb-4">Demographics</th>
                      <th className="pb-4">Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((patient) => (
                      <tr key={patient.id} className="border-b border-slate-50 last:border-0 text-sm font-semibold text-slate-700">
                        <td className="py-4 font-bold text-slate-800">{patient.full_name}</td>
                        <td className="py-4 text-slate-500 truncate max-w-[150px]">{patient.email}</td>
                        <td className="py-4 text-slate-600">{patient.phone || "N/A"}</td>
                        <td className="py-4 text-slate-600">{patient.age} yrs • {patient.gender}</td>
                        <td className="py-4 text-slate-400 text-xs truncate max-w-[150px]">{patient.address || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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