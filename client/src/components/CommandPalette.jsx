import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Compass, Shield, User, Heart, Settings, Briefcase, PlusCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const listRef = useRef(null);

  const commandItems = [
    { id: "patient", label: "Patient Health Workspace", category: "Navigation", route: "/patient-dashboard", icon: <User className="w-4 h-4 text-purple-500" /> },
    { id: "doctor", label: "Doctor Clinical Dashboard", category: "Navigation", route: "/doctor-dashboard", icon: <Shield className="w-4 h-4 text-green-500" /> },
    { id: "admin", label: "Hospital Admin Portal", category: "Navigation", route: "/admin-dashboard", icon: <Settings className="w-4 h-4 text-blue-500" /> },
    { id: "pharma", label: "Pharmacist Dispensary Hub", category: "Navigation", route: "/pharmacist-dashboard", icon: <Heart className="w-4 h-4 text-amber-500" /> },
    { id: "owner", label: "Clinic Owner Business View", category: "Navigation", route: "/clinic-owner-dashboard", icon: <Briefcase className="w-4 h-4 text-rose-500" /> },
    { id: "book", label: "Book a New Consultation Slot", category: "Patient Actions", route: "/patient-dashboard", action: "book", icon: <PlusCircle className="w-4 h-4 text-indigo-500" /> },
    { id: "symptom", label: "Triage Symptoms / Ask AI", category: "AI Tools", route: "/patient-dashboard", action: "chat", icon: <Compass className="w-4 h-4 text-cyan-500" /> },
  ];

  // Listen for keyboard shortcut (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredItems = commandItems.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  // Navigate using arrow keys
  useEffect(() => {
    if (!isOpen) return;
    
    const handleNavigationKeys = (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          triggerAction(filteredItems[selectedIndex]);
        }
      }
    };
    
    window.addEventListener("keydown", handleNavigationKeys);
    return () => window.removeEventListener("keydown", handleNavigationKeys);
  }, [isOpen, selectedIndex, filteredItems]);

  const triggerAction = (item) => {
    setIsOpen(false);
    setSearch("");
    
    // Set showcase switch support
    if (item.id === "patient") {
      localStorage.setItem("userRole", "Patient");
      localStorage.setItem("userName", "Patient Demo");
    } else if (item.id === "doctor") {
      localStorage.setItem("userRole", "Doctor");
      localStorage.setItem("userName", "Doctor Demo");
    } else if (item.id === "admin") {
      localStorage.setItem("userRole", "Hospital Admin");
      localStorage.setItem("userName", "Admin Demo");
    } else if (item.id === "pharma") {
      localStorage.setItem("userRole", "Pharmacist");
      localStorage.setItem("userName", "Pharmacist Demo");
    } else if (item.id === "owner") {
      localStorage.setItem("userRole", "Clinic Owner");
      localStorage.setItem("userName", "Owner Demo");
    }

    if (item.route) {
      navigate(item.route);
      window.location.reload();
    }
  };

  return (
    <>
      {/* Global Shortcut Help Indicator */}
      <div className="fixed bottom-6 left-6 z-50 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-black text-slate-300 shadow-xl pointer-events-none tracking-wider">
        <kbd className="bg-slate-800 text-white px-1.5 py-0.5 rounded border border-slate-600 font-sans">Ctrl</kbd>
        <span>+</span>
        <kbd className="bg-slate-800 text-white px-1.5 py-0.5 rounded border border-slate-600 font-sans">K</kbd>
        <span>Command Palette</span>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-start justify-center pt-24 px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
              className="bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col font-sans"
            >
              {/* Input box */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search commands, directories, and clinic tools..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setSelectedIndex(0);
                  }}
                  className="flex-1 bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 text-sm placeholder-slate-400"
                />
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold px-2 py-1 rounded-lg">ESC</span>
              </div>

              {/* Items List */}
              <div className="max-h-[300px] overflow-y-auto p-2" ref={listRef}>
                {filteredItems.length > 0 ? (
                  <div>
                    {/* Render Category Headings dynamically */}
                    {Object.entries(
                      filteredItems.reduce((acc, item) => {
                        acc[item.category] = acc[item.category] || [];
                        acc[item.category].push(item);
                        return acc;
                      }, {})
                    ).map(([category, items]) => (
                      <div key={category}>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-3 py-2">
                          {category}
                        </div>
                        <div className="space-y-0.5">
                          {items.map((item) => {
                            // Find absolute index in filteredItems array
                            const absIndex = filteredItems.findIndex((fi) => fi.id === item.id);
                            const active = selectedIndex === absIndex;

                            return (
                              <button
                                key={item.id}
                                onClick={() => triggerAction(item)}
                                onMouseEnter={() => setSelectedIndex(absIndex)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition-all duration-150 ${
                                  active
                                    ? "bg-blue-600 text-white"
                                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className={active ? "text-white" : ""}>
                                    {item.icon}
                                  </span>
                                  <span className="font-semibold">{item.label}</span>
                                </div>
                                <span className={`text-[10px] font-medium ${active ? "text-blue-100" : "text-slate-400"}`}>
                                  Jump
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-sm text-slate-400">
                    No results found for "{search}"
                  </div>
                )}
              </div>

              {/* Footer info */}
              <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                <div className="flex gap-3">
                  <span>↑↓ Navigate</span>
                  <span>↵ Select</span>
                </div>
                <span>MedFlow OS Shortcuts</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default CommandPalette;
