import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Compass, Home, ArrowLeft } from "lucide-react";

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-100 flex items-center justify-center p-6 font-sans">
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-12 max-w-md w-full border border-white text-center flex flex-col items-center gap-6">
        
        {/* Animated Compass Icon */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shadow-inner"
        >
          <Compass size={48} className="animate-pulse" />
        </motion.div>

        <div>
          <h1 className="text-6xl font-black text-slate-800 tracking-tight">404</h1>
          <h2 className="text-xl font-bold text-slate-700 mt-2">Page Not Found</h2>
          <p className="text-slate-400 text-xs font-semibold mt-2 leading-relaxed">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold py-3.5 px-4 rounded-xl text-sm transition shadow-sm"
          >
            <ArrowLeft size={16} />
            <span>Go Back</span>
          </button>
          
          <button
            onClick={() => navigate("/")}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition shadow-md shadow-blue-500/10"
          >
            <Home size={16} />
            <span>Go Home</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
