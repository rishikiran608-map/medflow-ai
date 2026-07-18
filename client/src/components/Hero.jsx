import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../api/api";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";

function Hero() {
  const navigate = useNavigate();
  const { t, locale } = useLanguage();
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [loggingIn, setLoggingIn] = useState(false);

  const handleTryDemo = async () => {
    setLoggingIn(true);
    try {
      const res = await api.post("/auth/login", {
        email: "admin@medflow.com",
        password: "admin123"
      });
      const data = res.data;
      if (data.session) {
        localStorage.setItem("token", data.session.access_token);
      }
      if (data.user) {
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("userEmail", "admin@medflow.com");
        localStorage.setItem("userName", data.user?.user_metadata?.full_name || "Admin Demo");
      }
      const role = data.user?.user_metadata?.role || "Hospital Admin";
      localStorage.setItem("userRole", role);
      
      toast.success("Welcome back! Redirecting to the Live Demo Admin Console...");
      setTimeout(() => {
        navigate("/admin-dashboard");
      }, 1000);
    } catch (err) {
      console.error(err);
      toast.error("Demo login failed. Make sure the database is seeded or register an account.");
    } finally {
      setLoggingIn(false);
    }
  };

  const demoSlides = [
    {
      title: locale === "te" ? "1. రిమోట్ బుకింగ్ & లైవ్ జాయిన్" : "1. Remote Booking & Live Join",
      description: t("how.step1_desc"),
      badge: locale === "te" ? "దశ 1 • రోగులు" : "Step 1 • Patients",
      icon: "📱",
      image: "/images/booking.jpg"
    },
    {
      title: locale === "te" ? "2. రియల్-టైమ్ AI అంచనాలు" : "2. Real-Time AI Predictions",
      description: t("how.step3_desc"),
      badge: locale === "te" ? "దశ 2 • ప్రెడిక్టివ్ AI" : "Step 2 • Predictive AI",
      icon: "🎯",
      image: "/images/predictions.jpg",
      link: "https://1drv.ms/i/c/706529691FE03F4A/IQAyKtrbbud_Qqo2hor5iSURAaQpMgytRmtGbSyQ1pYjh0Q?e=shEXtG"
    },
    {
      title: locale === "te" ? "3. లైవ్ ప్రయాణ ఆలస్యాల సింక్" : "3. Live Commute Sync",
      description: locale === "te" ? "గూగుల్ మ్యాప్స్ ట్రాఫిక్ ఫీడ్‌లను అనుసంధానిస్తుంది. ట్రాఫిక్ ఎక్కువగా ఉంటే సమయాలను అప్‌డేట్ చేస్తుంది." : "Integrates simulated Google Maps traffic feeds. If heavy traffic blocks the route, the system updates travel ETAs and notifies the doctor.",
      badge: locale === "te" ? "దశ 3 • ప్రయాణ మార్గం" : "Step 3 • Commute Sync",
      icon: "🗺️",
      image: "/images/commute.jpg",
      link: "https://chatgpt.com/s/m_6a5a55df70088191a141c6d48bf7cd98"
    },
    {
      title: locale === "te" ? "4. కాంటాక్ట్‌లెస్ QR చెక్-ఇన్" : "4. Contactless QR Check-in",
      description: t("how.step4_desc"),
      badge: locale === "te" ? "దశ 4 • క్లినిక్ రాక" : "Step 4 • Clinic Arrival",
      icon: "🎫",
      image: "/images/qr_checkin.jpg"
    }
  ];

  return (
    <section id="home" className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-100 font-sans">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20 grid md:grid-cols-2 items-center gap-12 text-left">

        {/* Left Side */}
        <motion.div
          initial={{ opacity: 0, x: -80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
        >
          <p className="text-blue-600 font-semibold mb-3">
            {t("hero.sub")}
          </p>

          <motion.h1
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-extrabold leading-tight text-slate-800"
          >
            {locale === "te" ? (
              <span>వేచి ఉండే గదిని <span className="text-blue-600">దాటవేయండి</span></span>
            ) : (
              <span>Skip the <span className="text-blue-600">Waiting Room</span></span>
            )}
          </motion.h1>

          <p className="mt-6 text-slate-500 text-lg leading-relaxed font-medium">
            {t("hero.desc")}
          </p>

          {/* Impact Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-6 flex flex-wrap gap-4"
          >
            {[
              { icon: "⏱️", value: locale === "te" ? "2+ గంటలు" : "2+ hrs", label: t("hero.saved") },
              { icon: "📉", value: "20%", label: t("hero.noshow") },
              { icon: "💰", value: locale === "te" ? "₹1లక్ష/నెల" : "₹1L/mo", label: t("hero.revenue") },
              { icon: "🤖", value: locale === "te" ? "3 AI" : "3 AI", label: t("hero.engines") },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2 bg-white border border-slate-100 rounded-xl px-3 py-2 shadow-sm">
                <span className="text-lg">{stat.icon}</span>
                <div>
                  <p className="text-sm font-black text-slate-800 leading-none">{stat.value}</p>
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </motion.div>

          <div className="mt-8 flex items-center gap-4 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleTryDemo}
              disabled={loggingIn}
              className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-extrabold px-6 py-3.5 rounded-xl hover:shadow-xl transition duration-300 shadow-md shadow-blue-500/10 text-sm flex items-center gap-2 cursor-pointer"
            >
              ⚡ {loggingIn ? t("hero.logging") : t("hero.tryDemo")}
            </motion.button>

            <Link to="/login">
              <motion.button
                whileHover={{ scale: 1.05, y: -1 }}
                className="border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 px-6 py-3.5 rounded-xl transition font-extrabold text-sm tracking-tight shadow-sm flex items-center gap-1 cursor-pointer"
              >
                {t("hero.getStarted")}
              </motion.button>
            </Link>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setActiveSlide(0);
                setShowDemoModal(true);
              }}
              className="border border-slate-300 text-slate-500 px-6 py-3.5 rounded-xl hover:bg-slate-50 hover:text-slate-700 transition font-semibold text-sm cursor-pointer"
            >
              {t("hero.walkthrough")}
            </motion.button>
          </div>
        </motion.div>

        {/* Right Side */}
        <motion.div
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
          className="flex justify-center"
        >
          <motion.img
            whileHover={{
              scale: 1.05,
              rotate: 2,
            }}
            transition={{ duration: 0.5 }}
            src="/images/hero_doctor.jpg"
            className="rounded-3xl shadow-2xl"
            alt="Doctor"
            loading="lazy"
          />
        </motion.div>

        {/* Watch Demo interactive slides modal */}
        <AnimatePresence>
          {showDemoModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl border border-slate-100 text-left relative overflow-hidden"
              >
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setShowDemoModal(false)}
                  className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition font-bold cursor-pointer"
                >
                  ✕
                </button>

                <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {demoSlides[activeSlide].badge}
                </span>

                <div className="grid md:grid-cols-2 gap-6 mt-6 items-center">
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                      <span className="text-3xl">{demoSlides[activeSlide].icon}</span>
                      {demoSlides[activeSlide].title}
                    </h3>
                    <p className="text-slate-500 text-sm mt-4 leading-relaxed font-semibold">
                      {demoSlides[activeSlide].description}
                    </p>
                    {demoSlides[activeSlide].link && (
                      <a 
                        href={demoSlides[activeSlide].link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-sm transition"
                      >
                        🔗 {locale === "te" ? "డెమో లింక్ ఓపెన్ చేయండి" : "Open Demo Link"}
                      </a>
                    )}
                  </div>

                  <div className="h-48 w-full bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
                    <img 
                      src={demoSlides[activeSlide].image} 
                      alt={demoSlides[activeSlide].title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Footer / Controls */}
                <div className="flex justify-between items-center mt-8 border-t pt-6">
                  {/* Indicators */}
                  <div className="flex gap-2">
                    {demoSlides.map((_, i) => (
                      <span 
                        key={i}
                        className={`h-2 rounded-full transition-all duration-300 ${activeSlide === i ? "w-6 bg-blue-600" : "w-2 bg-slate-200"}`}
                      />
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      disabled={activeSlide === 0}
                      onClick={() => setActiveSlide(prev => Math.max(0, prev - 1))}
                      className="px-4 py-2 border rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition cursor-pointer"
                    >
                      {locale === "te" ? "మునుపటిది" : "Previous"}
                    </button>
                    {activeSlide === demoSlides.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setShowDemoModal(false)}
                        className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition cursor-pointer"
                      >
                        {locale === "te" ? "పూర్తి చేయండి" : "Finish Walkthrough"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveSlide(prev => Math.min(demoSlides.length - 1, prev + 1))}
                        className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition cursor-pointer"
                      >
                        {locale === "te" ? "తదుపరిది" : "Next"}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}

export default Hero;