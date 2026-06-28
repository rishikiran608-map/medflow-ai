import { motion } from "framer-motion";

function FeatureCard({ icon, title, description }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 80, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{
        duration: 0.6,
        ease: "easeOut",
      }}
      whileHover={{
        scale: 1.05,
        rotate: 1,
        y: -10,
      }}
      className="group relative overflow-hidden rounded-3xl border border-blue-100 bg-white/80 backdrop-blur-xl p-8 shadow-lg transition-all"
    >
      {/* Animated Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition duration-500"></div>

      {/* Icon */}
      <motion.div
        whileHover={{
          rotate: [0, -10, 10, -10, 0],
          scale: 1.2,
        }}
        transition={{ duration: 0.6 }}
        className="text-6xl mb-6"
      >
        {icon}
      </motion.div>

      {/* Title */}
      <h3 className="text-2xl font-bold mb-4 text-gray-800">
        {title}
      </h3>

      {/* Description */}
      <p className="text-gray-600 leading-7">
        {description}
      </p>

      {/* Animated Bottom Line */}
      <motion.div
        className="mt-6 h-1 bg-blue-600 rounded-full"
        initial={{ width: 0 }}
        whileHover={{ width: "100%" }}
        transition={{ duration: 0.4 }}
      />
    </motion.div>
  );
}

export default FeatureCard;