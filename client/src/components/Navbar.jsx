import { motion } from "framer-motion";
import { Link } from "react-router-dom";
function Navbar() {
return (
  <motion.nav
    initial={{ y: -80, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.8 }}
    className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg shadow-md"
  >
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-5 flex justify-between items-center">

      <motion.h1
        whileHover={{ scale: 1.1, rotate: -2 }}
        className="text-3xl font-bold text-blue-600"
      >
        MedFlow AI
      </motion.h1>

      <div className="hidden md:flex items-center gap-8">
        <a href="#home">Home</a>
        <a href="#features">Features</a>
        <a href="#dashboard">Dashboard</a>
        <a href="#">About</a>
        <a href="#">Contact</a>
      </div>

      <Link to="/login">
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
  >
    Login
  </motion.button>
</Link>

    </div>
  </motion.nav>
);
}

export default Navbar;