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
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleQuickFill = (roleName) => {
    const credentials = {
      admin:   { email: "admin@medflow.com",   password: "admin123" },
      doctor:  { email: "doctor@medflow.com",  password: "doctor123" },
      patient: { email: "patient@medflow.com", password: "patient123" },
    };
    const cred = credentials[roleName];
    if (cred) setFormData((prev) => ({ ...prev, ...cred }));
  };

  const handleLogin = async () => {
    setError("");
    setSuccess("");
    const res = await api.post("/auth/login", {
      email: formData.email,
      password: formData.password,
    });

    const data = res.data;

    if (data.session) {
      localStorage.setItem("token", data.session.access_token);
    }
    if (data.user) {
      localStorage.setItem("userId", data.user.id);
      localStorage.setItem("userEmail", formData.email);
      localStorage.setItem("userName", data.user?.user_metadata?.full_name || "User");
    }

    const role = data.user?.user_metadata?.role || formData.role;
    localStorage.setItem("userRole", role);

    if (role === "Patient") navigate("/book-appointment");
    else if (role === "Doctor") navigate("/doctor-dashboard");
    else navigate("/admin-dashboard");
  };

  const handleRegister = async () => {
    setError("");
    setSuccess("");
    const res = await api.post("/auth/register", {
      full_name: formData.full_name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      phone: formData.phone,
    });

    if (res.data.success) {
      setSuccess("✅ Account registered successfully! Please log in.");
      setIsRegistering(false);
      setFormData((prev) => ({ ...prev, password: "" }));
    }
  };

  const handleError = (err) => {
    console.error(err);
    const details = err.response?.data;
    setError(
      details?.message ||
      details?.error_description ||
      details?.error ||
      err.message ||
      "Something went wrong. Please try again."
    );
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
              {/* Demo Account Quick Fill */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2.5">
                  ⚡ Hackathon Demo Accounts
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "admin",   label: "Admin",   cls: "bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100" },
                    { key: "doctor",  label: "Doctor",  cls: "bg-green-50 border-green-100 text-green-700 hover:bg-green-100" },
                    { key: "patient", label: "Patient", cls: "bg-purple-50 border-purple-100 text-purple-700 hover:bg-purple-100" },
                  ].map(({ key, label, cls }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleQuickFill(key)}
                      className={`border font-extrabold py-2 px-1 rounded-xl text-[10px] transition ${cls}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <FormInput label="Email Address" name="email"    type="email"    placeholder="name@example.com" value={formData.email}    onChange={handleChange} />
              <FormInput label="Password"      name="password" type="password" placeholder="••••••••"         value={formData.password} onChange={handleChange} />

              <SubmitButton
                label="Sign In"
                loadingLabel="Signing in..."
                onSubmit={handleLogin}
                onError={handleError}
              />

              <button
                onClick={() => { setError(""); setSuccess(""); setIsRegistering(true); }}
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
              <FormInput label="Full Name"     name="full_name" type="text"     placeholder="John Doe"         value={formData.full_name} onChange={handleChange} />
              <FormInput label="Phone Number"  name="phone"     type="text"     placeholder="10 digit number"  value={formData.phone}     onChange={handleChange} />
              <FormInput label="Email Address" name="email"     type="email"    placeholder="name@example.com" value={formData.email}     onChange={handleChange} />
              <FormInput label="Password"      name="password"  type="password" placeholder="••••••••"         value={formData.password}  onChange={handleChange} />

              <SubmitButton
                label="Register Account"
                loadingLabel="Registering..."
                onSubmit={handleRegister}
                onError={handleError}
              />

              <button
                onClick={() => { setError(""); setSuccess(""); setIsRegistering(false); }}
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

// ─── Reusable labelled input ───────────────────────────────────────────────────
function FormInput({ label, name, type, placeholder, value, onChange }) {
  return (
    <div>
      <label className="font-semibold text-slate-700 text-sm">{label}</label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full mt-2 border border-slate-200 rounded-xl p-3 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium"
      />
    </div>
  );
}

// ─── Submit button with self-contained loading guard ──────────────────────────
// Immediately disables on first click → prevents double-submit lag.
function SubmitButton({ label, loadingLabel, onSubmit, onError }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;       // hard guard against rapid re-clicks
    setLoading(true);
    try {
      await onSubmit();
    } catch (err) {
      onError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20 mt-2 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4 text-white shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {loading ? loadingLabel : label}
    </button>
  );
}

export default LoginPage;