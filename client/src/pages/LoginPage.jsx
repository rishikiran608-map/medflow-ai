import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { supabase } from "../lib/supabaseClient";
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
      admin:      { email: "admin@medflow.com",      password: "admin123" },
      doctor:     { email: "doctor@medflow.com",     password: "doctor123" },
      patient:    { email: "patient@medflow.com",    password: "patient123" },
      pharmacist: { email: "pharmacist@medflow.com", password: "pharmacist123" },
      owner:      { email: "owner@medflow.com",      password: "owner123" }
    };
    const cred = credentials[roleName];
    if (cred) setFormData((prev) => ({ ...prev, ...cred }));
  };

  const handleGoogleLogin = async () => {
    setError("");
    setSuccess("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
    if (error) {
      setError(error.message || "Google sign-in failed. Please try again.");
    }
    // On success, browser redirects to Google — no further action needed here
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

    if (role === "Patient") navigate("/patient-dashboard");
    else if (role === "Doctor") navigate("/doctor-dashboard");
    else if (role === "Pharmacist") navigate("/pharmacist-dashboard");
    else if (role === "Clinic Owner") navigate("/clinic-owner-dashboard");
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { key: "admin",      label: "Admin",      cls: "bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100" },
                    { key: "doctor",     label: "Doctor",     cls: "bg-green-50 border-green-100 text-green-700 hover:bg-green-100" },
                    { key: "patient",    label: "Patient",    cls: "bg-purple-50 border-purple-100 text-purple-700 hover:bg-purple-100" },
                    { key: "pharmacist", label: "Pharma",     cls: "bg-amber-50 border-amber-100 text-amber-700 hover:bg-amber-100" },
                    { key: "owner",      label: "Owner",      cls: "bg-rose-50 border-rose-100 text-rose-700 hover:bg-rose-100" }
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

              {/* ── Divider ── */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 font-semibold">OR</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* ── Google OAuth Button ── */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-3.5 rounded-xl font-bold transition shadow-sm hover:shadow-md active:scale-[0.98]"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

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

              {/* ── Divider ── */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 font-semibold">OR</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* ── Google OAuth Button ── */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-3.5 rounded-xl font-bold transition shadow-sm hover:shadow-md active:scale-[0.98]"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign up with Google
              </button>

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