import { motion } from "framer-motion";

function Stats() {
  const stats = [
    { number: "50+", text: "Hospitals" },
    { number: "100K+", text: "Patients Served" },
    { number: "95%", text: "Waiting Time Reduced" },
    { number: "24/7", text: "AI Monitoring" },
  ];

  return (
    <section className="py-20 bg-blue-600 text-white">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 text-center">

        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 80 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2 }}
            viewport={{ once: true }}
              whileHover={{
              scale: 1.08,
              y: -8,
           }}
          >
            <h2 className="text-5xl font-bold">{stat.number}</h2>
            <p className="mt-4 text-lg">{stat.text}</p>
          </motion.div>
        ))}

      </div>
    </section>
  );
}

export default Stats;