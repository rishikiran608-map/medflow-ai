import { motion } from "framer-motion";

function Hero() {
  return (
    <section className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-100">
      <div className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 items-center gap-12">

        {/* Left Side */}
        <motion.div
          initial={{ opacity: 0, x: -80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
        >
          <p className="text-blue-600 font-semibold mb-3">
            🚑 AI Powered Hospital Queue Management
          </p>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight">
            Skip the
            <span className="text-blue-600"> Waiting Room</span>
          </h1>

          <p className="mt-6 text-gray-600 text-lg">
            MedFlow AI predicts waiting time, lets patients join queues remotely,
            and helps hospitals reduce overcrowding.
          </p>

          <div className="mt-8 flex gap-4">
            <button className="bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition">
              Get Started
            </button>

            <button className="border border-blue-600 text-blue-600 px-8 py-4 rounded-xl hover:bg-blue-50 transition">
              Watch Demo
            </button>
          </div>
        </motion.div>

        {/* Right Side */}
        <motion.div
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
          className="flex justify-center"
        >
          <img
            src="https://images.unsplash.com/photo-1584515933487-779824d29309?w=800"
            alt="Doctor"
            className="rounded-3xl shadow-2xl"
          />
        </motion.div>

      </div>
    </section>
  );
}

export default Hero;