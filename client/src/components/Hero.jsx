import { motion } from "framer-motion";
import { Link } from "react-router-dom";


function Hero() {
  return (
    <section id ="home" 
    className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-100">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20 grid md:grid-cols-2 items-center gap-12">

        {/* Left Side */}
        <motion.div
          initial={{ opacity: 0, x: -80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
        >
          <p className="text-blue-600 font-semibold mb-3">
            🚑 AI Powered Hospital Queue Management
          </p>

          <motion.h1
  initial={{ opacity: 0, y: -50 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8 }}
  className="text-5xl md:text-7xl font-extrabold leading-tight"
>
            Skip the
            <span className="text-blue-600"> Waiting Room</span>
          </motion.h1>

          <p className="mt-6 text-gray-600 text-lg">
            MedFlow AI predicts waiting time, lets patients join queues remotely,
            and helps hospitals reduce overcrowding.
          </p>

          <div className="mt-8 flex items-center gap-6">
            <Link to="/login">
              <motion.button
                whileHover={{ x: 2 }}
                className="text-slate-700 hover:text-blue-600 transition font-bold text-sm tracking-tight"
              >
                Get Started
              </motion.button>
            </Link>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="border border-slate-300 text-slate-500 px-6 py-3 rounded-xl hover:bg-slate-50 hover:text-slate-700 transition font-semibold text-sm"
            >
              Watch Demo
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
  src={"https://images.unsplash.com/photo-1584515933487-779824d29309?w=800"}
  className="rounded-3xl shadow-2xl"
   alt="Doctor"
/>
          
        </motion.div>

      </div>
    </section>
  );
}

export default Hero;