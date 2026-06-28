import Navbar from "../components/Navbar";
function LandingPage() {
  return (
  <div className="min-h-screen bg-blue-50">
    <Navbar />

    <div className="flex flex-col items-center justify-center mt-32">
      <h1 className="text-6xl font-bold text-blue-700">
        Welcome to MedFlow AI
      </h1>

      <p className="mt-6 text-xl text-gray-600">
        Smart Hospital Queue Management System
      </p>

      <button className="mt-8 bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700">
        Get Started
      </button>
    </div>
  </div>
);
}

export default LandingPage;