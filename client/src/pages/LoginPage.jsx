import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle } from "lucide-react";

function LoginPage() {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    role: "Patient",
    email: "",
    password: "",
    full_name: "",
    phone: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async () => {
    setError("");
    setSuccess("");
    try {
      const res = await api.post(
        "/auth/login",
        {
          email: formData.email,
          password: formData.password,
        }
      );

      const data = res.data;
      console.log("LOGIN RESPONSE:", data);

      if (data.session) {
        localStorage.setItem("token", data.session.access_token);
      }

      if (data.user) {
        localStorage.setItem("userId", data.user.id);
      }

      const role = data.user?.user_metadata?.role || formData.role;

      if (role === "Patient") {
        navigate("/book-appointment");
      } else if (role === "Doctor") {
        navigate("/doctor-dashboard");
      } else {
        navigate("/admin-dashboard");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Invalid Email or Password");
    }
  };

  const handleRegister = async () => {
    setError("");
    setSuccess("");
    try {
      const res = await api.post(
        "/auth/register",
        {
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          phone: formData.phone,
        }
      );

      if (res.data.success) {
        setSuccess("✅ Account registered successfully! Please log in.");
        setIsRegistering(false);
        setFormData({
          ...formData,
          password: "", // Clear password
        });
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Registration failed. Try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-cyan-100 flex items-center justify-center p-6 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-10 w-full max-w-md border border-white"
      >
        <h1 className="text-4xl font-black text-center text-blue-600 tracking-tight">
          MedFlow AI
        </h1>

        <p className="text-center text-gray-500 mt-2 font-medium">
          Smart Hospital Queue Management
        </p>

        <AnimatePresence mode="wait">
          {!isRegistering ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="mt-8 space-y-5"
            >
              <div>
                <label className="font-semibold text-slate-700 text-sm">Role</label>
                <div className="relative mt-2">
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full border border-slate-200 rounded-xl p-3 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  >
                    <option value="Patient">Patient</option>
                    <option value="Doctor">Doctor</option>
                    <option value="Hospital Admin">Hospital Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 text-sm">Email Address</label>
                <div className="relative mt-2">
                  <input
                    type="email"
                    name="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full border border-slate-200 rounded-xl p-3 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 text-sm">Password</label>
                <div className="relative mt-2">
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full border border-slate-200 rounded-xl p-3 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium"
                  />
                </div>
              </div>

              <button
                onClick={handleLogin}
                className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-500/20 mt-2"
              >
                Sign In
              </button>

              <button
                onClick={() => setIsRegistering(true)}
                className="w-full border border-blue-600 text-blue-600 py-3.5 rounded-xl font-bold hover:bg-blue-50 transition"
              >
                Create Account
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="mt-8 space-y-5"
            >
              <div>
                <label className="font-semibold text-slate-700 text-sm">Full Name</label>
                <div className="relative mt-2">
                  <input
                    type="text"
                    name="full_name"
                    placeholder="John Doe"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full border border-slate-200 rounded-xl p-3 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 text-sm">Phone Number</label>
                <div className="relative mt-2">
                  <input
                    type="text"
                    name="phone"
                    placeholder="10 digit number"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full border border-slate-200 rounded-xl p-3 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 text-sm">Register As</label>
                <div className="relative mt-2">
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full border border-slate-200 rounded-xl p-3 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  >
                    <option value="Patient">Patient</option>
                    <option value="Doctor">Doctor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 text-sm">Email Address</label>
                <div className="relative mt-2">
                  <input
                    type="email"
                    name="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full border border-slate-200 rounded-xl p-3 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 text-sm">Password</label>
                <div className="relative mt-2">
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full border border-slate-200 rounded-xl p-3 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium"
                  />
                </div>
              </div>

              <button
                onClick={handleRegister}
                className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-500/20 mt-2"
              >
                Register Account
              </button>

              <button
                onClick={() => setIsRegistering(false)}
                className="w-full border border-slate-300 text-slate-600 py-3.5 rounded-xl font-bold hover:bg-slate-50 transition"
              >
                Back to Sign In
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error / Success Notifications */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-6 flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl border border-red-100 text-sm font-semibold"
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-6 flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-xl border border-green-100 text-sm font-semibold"
            >
              <CheckCircle size={16} />
              <span>{success}</span>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
}

export default LoginPage;