import { Link, useNavigate } from "react-router-dom";
import { LogOut, User, Menu, X, Sun, Moon } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";

function Navbar() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark" || 
      (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);
  
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
      navigate("/book-appointment");
    } else if (newRole === "Doctor") {
      navigate("/doctor-dashboard");
    } else {
      navigate("/admin-dashboard");
    }
    window.location.reload();
  };

  const handleNavClick = (sectionId) => {
    setMobileMenuOpen(false);
    if (window.location.pathname !== "/") {
      navigate("/");
      // Wait for navigation transition before scrolling
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 300);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const getDashboardLink = () => {
    if (!token) return "/login";
    if (role === "Patient") return "/patient-dashboard";
    if (role === "Doctor") return "/doctor-dashboard";
    return "/admin-dashboard";
  };

  return (
    <nav className="bg-white/90 backdrop-blur-md sticky top-0 z-50 px-8 py-4 border-b border-slate-100/50 shadow-sm font-sans">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Link */}
        <Link 
          to={token ? getDashboardLink() : "/"} 
          className="text-2xl font-black text-blue-600 tracking-tight"
          onClick={() => setMobileMenuOpen(false)}
        >
          MedFlow AI
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="font-medium text-sm text-slate-500 hover:text-blue-600 transition">Home</Link>
          <button
            onClick={() => handleNavClick("features")}
            className="font-medium text-sm text-slate-500 hover:text-blue-600 transition cursor-pointer"
          >
            Features
          </button>
          <Link to={getDashboardLink()} className="font-medium text-sm text-slate-500 hover:text-blue-600 transition">Dashboard</Link>
          <button
            onClick={() => handleNavClick("about")}
            className="font-medium text-sm text-slate-500 hover:text-blue-600 transition cursor-pointer"
          >
            About
          </button>
          <button
            onClick={() => handleNavClick("contact")}
            className="font-medium text-sm text-slate-500 hover:text-blue-600 transition cursor-pointer"
          >
            Contact
          </button>
        </div>

        {/* Right side: Login button or User Menu */}
        <div className="hidden md:flex items-center gap-4">
          {/* Dark Mode Toggle (Task 13) */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun size={16} className="text-yellow-500" /> : <Moon size={16} />}
          </button>

          {token ? (
            <div className="flex items-center gap-3">
              <div className="flex flex-col text-right">
                <span className="text-[10px] font-black text-blue-600 block mb-0.5 tracking-wider">Showcase Switcher</span>
                <select
                  value={role || "Patient"}
                  onChange={(e) => handleRoleSwitch(e.target.value)}
                  className="border border-slate-200 rounded-lg px-2 py-0.5 text-[10px] font-bold text-slate-700 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Patient">Patient</option>
                  <option value="Doctor">Doctor</option>
                  <option value="Hospital Admin">Admin</option>
                </select>
              </div>
              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-600" title={`${userName} (${role})`}>
                <User size={16} />
              </div>
              <button
                onClick={handleLogout}
                className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition"
                title="Sign Out"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <Link 
              to="/login" 
              className="bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition shadow-md shadow-blue-500/10 text-sm"
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-600 hover:text-slate-800 transition"
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
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-50 rounded-xl text-sm">Home</Link>
          <button
            onClick={() => handleNavClick("features")}
            className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-50 rounded-xl text-sm text-left w-full"
          >
            Features
          </button>
          <Link to={getDashboardLink()} onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-50 rounded-xl text-sm">Dashboard</Link>
          <button
            onClick={() => handleNavClick("about")}
            className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-50 rounded-xl text-sm text-left w-full"
          >
            About
          </button>
          <button
            onClick={() => handleNavClick("contact")}
            className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-50 rounded-xl text-sm text-left w-full"
          >
            Contact
          </button>
          
          <div className="border-t border-slate-100 my-1"></div>
          
          {/* Mobile Dark Mode Toggle */}
          <button
            onClick={() => {
              setIsDarkMode(!isDarkMode);
              setMobileMenuOpen(false);
            }}
            className="px-4 py-2 flex items-center justify-between text-slate-600 hover:bg-slate-50 rounded-xl text-sm"
          >
            <span className="font-medium">Dark Mode</span>
            {isDarkMode ? <Sun size={16} className="text-yellow-500" /> : <Moon size={16} />}
          </button>

          <div className="border-t border-slate-100 my-1"></div>
          {token ? (
            <div className="px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
                  <User size={16} />
                </div>
                <div>
                  <span className="text-[9px] font-black text-blue-600 uppercase tracking-wider block mb-0.5">Showcase Switcher</span>
                  <select
                    value={role || "Patient"}
                    onChange={(e) => {
                      handleRoleSwitch(e.target.value);
                      setMobileMenuOpen(false);
                    }}
                    className="border border-slate-200 rounded-lg px-2 py-0.5 text-[10px] font-bold text-slate-700 bg-slate-50 focus:outline-none"
                  >
                    <option value="Patient">Patient</option>
                    <option value="Doctor">Doctor</option>
                    <option value="Hospital Admin">Admin</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition"
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
              Login
            </Link>
          )}
        </motion.div>
      )}

    </nav>
  );
}

export default Navbar;