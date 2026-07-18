import { Link, useNavigate } from "react-router-dom";
import { LogOut, User, Menu, X, Globe } from "lucide-react";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";

function Navbar() {
  const navigate = useNavigate();
  const { locale, t, changeLanguage } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const token = useMemo(() => localStorage.getItem("token"), []);
  const role = useMemo(() => localStorage.getItem("userRole"), []);
  const userName = useMemo(() => localStorage.getItem("userName") || "User", []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    setMobileMenuOpen(false);
    navigate("/login");
  };

  const handleRoleSwitch = (newRole) => {
    localStorage.setItem("userRole", newRole);
    localStorage.setItem("userName", `${newRole} Demo`);
    if (newRole === "Patient") {
      navigate("/patient-dashboard");
    } else if (newRole === "Doctor") {
      navigate("/doctor-dashboard");
    } else if (newRole === "Pharmacist") {
      navigate("/pharmacist-dashboard");
    } else if (newRole === "Clinic Owner") {
      navigate("/clinic-owner-dashboard");
    } else {
      navigate("/admin-dashboard");
    }
    window.location.reload();
  };

  const handleNavClick = (sectionId) => {
    setMobileMenuOpen(false);
    if (window.location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) element.scrollIntoView({ behavior: "smooth" });
      }, 300);
    } else {
      const element = document.getElementById(sectionId);
      if (element) element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const getDashboardLink = () => {
    if (!token) return "/login";
    if (role === "Patient") return "/patient-dashboard";
    if (role === "Doctor") return "/doctor-dashboard";
    if (role === "Pharmacist") return "/pharmacist-dashboard";
    if (role === "Clinic Owner") return "/clinic-owner-dashboard";
    return "/admin-dashboard";
  };

  return (
    <nav className="bg-white/90 backdrop-blur-md sticky top-0 z-50 px-8 py-4 border-b border-slate-100/50 shadow-sm font-sans text-left">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Brand */}
        <Link
          to={token ? getDashboardLink() : "/"}
          className="text-2xl font-black text-blue-600 tracking-tight"
          onClick={() => setMobileMenuOpen(false)}
        >
          {t("nav.brand")}
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="font-semibold text-sm text-slate-500 hover:text-blue-600 transition">
            {t("nav.home")}
          </Link>
          <button
            onClick={() => handleNavClick("features")}
            className="font-semibold text-sm text-slate-500 hover:text-blue-600 transition cursor-pointer"
          >
            {t("nav.features")}
          </button>
          <Link to={getDashboardLink()} className="font-semibold text-sm text-slate-500 hover:text-blue-600 transition">
            {t("nav.dashboard")}
          </Link>
          <button
            onClick={() => handleNavClick("about")}
            className="font-semibold text-sm text-slate-500 hover:text-blue-600 transition cursor-pointer"
          >
            {t("nav.about")}
          </button>
          <button
            onClick={() => handleNavClick("contact")}
            className="font-semibold text-sm text-slate-500 hover:text-blue-600 transition cursor-pointer"
          >
            {t("nav.contact")}
          </button>
          <a
            href="/presentation.html"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-sm text-slate-500 hover:text-blue-600 transition flex items-center gap-1"
          >
            🎨 Pitch Slides
          </a>
        </div>

        {/* Desktop Right Controls */}
        <div className="hidden md:flex items-center gap-4">

          {/* Language Selector */}
          <div className="relative group z-50">
            <button className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-extrabold text-slate-700 hover:bg-slate-100 transition cursor-pointer">
              <Globe size={14} className="text-slate-500" />
              <span>{locale === "en" ? "🇮🇳 English" : "🇮🇳 తెలుగు"}</span>
            </button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-white border border-slate-100 rounded-xl shadow-xl p-1 w-28 text-left z-50">
              <button
                onClick={() => changeLanguage("en")}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  locale === "en" ? "bg-blue-50 text-blue-600" : "hover:bg-slate-50 text-slate-700"
                }`}
              >
                🇮🇳 English
              </button>
              <button
                onClick={() => changeLanguage("te")}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  locale === "te" ? "bg-blue-50 text-blue-600" : "hover:bg-slate-50 text-slate-700"
                }`}
              >
                🇮🇳 తెలుగు
              </button>
            </div>
          </div>

          {/* Auth Area */}
          {token ? (
            <div className="flex items-center gap-3">
              <div className="flex flex-col text-right">
                <span className="text-[9px] font-black text-blue-600 block mb-0.5 tracking-wider">
                  {t("nav.showcase")}
                </span>
                <select
                  value={role || "Patient"}
                  onChange={(e) => handleRoleSwitch(e.target.value)}
                  className="border border-slate-200 rounded-lg px-2 py-0.5 text-[9px] font-bold text-slate-700 bg-slate-50 focus:outline-none cursor-pointer"
                >
                  <option value="Patient">Patient</option>
                  <option value="Doctor">Doctor</option>
                  <option value="Hospital Admin">Admin</option>
                  <option value="Pharmacist">Pharmacist</option>
                  <option value="Clinic Owner">Clinic Owner</option>
                </select>
              </div>
              <div
                className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-600"
                title={`${userName} (${role})`}
              >
                <User size={16} />
              </div>
              <button
                onClick={handleLogout}
                className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition cursor-pointer"
                title={t("nav.logout")}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition shadow-md shadow-blue-500/10 text-sm"
            >
              {t("nav.login")}
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-600 hover:text-slate-800 transition cursor-pointer"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden mt-4 pt-4 border-t border-slate-100 flex flex-col gap-3 text-left"
        >
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-50 rounded-xl text-sm"
          >
            {t("nav.home")}
          </Link>
          <button
            onClick={() => handleNavClick("features")}
            className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-50 rounded-xl text-sm text-left w-full cursor-pointer"
          >
            {t("nav.features")}
          </button>
          <Link
            to={getDashboardLink()}
            onClick={() => setMobileMenuOpen(false)}
            className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-50 rounded-xl text-sm"
          >
            {t("nav.dashboard")}
          </Link>
          <button
            onClick={() => handleNavClick("about")}
            className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-50 rounded-xl text-sm text-left w-full cursor-pointer"
          >
            {t("nav.about")}
          </button>
          <button
            onClick={() => handleNavClick("contact")}
            className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-50 rounded-xl text-sm text-left w-full cursor-pointer"
          >
            {t("nav.contact")}
          </button>
          <a
            href="/presentation.html"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMobileMenuOpen(false)}
            className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-50 rounded-xl text-sm block"
          >
            🎨 Pitch Slides
          </a>
          <div className="border-t border-slate-100 my-1" />

          {/* Mobile Language Switcher */}
          <div className="px-4 py-2 flex items-center justify-between">
            <span className="font-semibold text-slate-600 text-sm">Language</span>
            <div className="flex gap-2">
              <button
                onClick={() => { changeLanguage("en"); setMobileMenuOpen(false); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                  locale === "en" ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                English
              </button>
              <button
                onClick={() => { changeLanguage("te"); setMobileMenuOpen(false); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                  locale === "te" ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                తెలుగు
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 my-1" />

          {token ? (
            <div className="px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
                  <User size={16} />
                </div>
                <div>
                  <span className="text-[9px] font-black text-blue-600 uppercase tracking-wider block mb-0.5">
                    {t("nav.showcase")}
                  </span>
                  <select
                    value={role || "Patient"}
                    onChange={(e) => {
                      handleRoleSwitch(e.target.value);
                      setMobileMenuOpen(false);
                    }}
                    className="border border-slate-200 rounded-lg px-2 py-0.5 text-[10px] font-bold text-slate-700 bg-slate-50 focus:outline-none cursor-pointer"
                  >
                    <option value="Patient">Patient</option>
                    <option value="Doctor">Doctor</option>
                    <option value="Hospital Admin">Admin</option>
                    <option value="Pharmacist">Pharmacist</option>
                    <option value="Clinic Owner">Clinic Owner</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition cursor-pointer"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="mx-4 bg-blue-600 text-white font-bold py-2.5 rounded-xl hover:bg-blue-700 transition text-center text-sm shadow-md"
            >
              {t("nav.login")}
            </Link>
          )}
        </motion.div>
      )}
    </nav>
  );
}

export default Navbar;