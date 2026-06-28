import { motion } from "framer-motion";
import FeatureCard from "./FeatureCard";

function Features() {
  const features = [
    {
      icon: "🏥",
      title: "Live Queue",
      description: "See your token and waiting time in real time."
    },
    {
      icon: "📱",
      title: "Mobile Notifications",
      description: "Get notified when your turn is near."
    },
    {
      icon: "📊",
      title: "Hospital Dashboard",
      description: "Doctors and staff manage queues efficiently."
    }
  ];

  return (
    <section className="py-24 bg-white">
      <motion.h2
        initial={{ opacity: 0, y: -30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-5xl font-bold text-center mb-16"
      >
        Features
      </motion.h2>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6">
        {features.map((feature, index) => (
          <FeatureCard key={index} {...feature} />
        ))}
      </div>
    </section>
  );
}

export default Features;