function Hero() {
  return (
    <section className="bg-blue-50 min-h-[90vh] flex items-center">
      <div className="max-w-7xl mx-auto px-10 grid md:grid-cols-2 gap-10 items-center">

        {/* Left Side */}
        <div>
          <span className="text-blue-600 font-semibold">
            AI Powered Hospital Management
          </span>

          <h1 className="text-6xl font-bold mt-4 leading-tight">
            Hospital Queue
            <br />
            Management
            <span className="text-blue-600"> Made Smart</span>
          </h1>

          <p className="text-gray-600 mt-6 text-lg">
            Reduce waiting time, track live queue status,
            receive instant notifications and improve
            the hospital experience for every patient.
          </p>

          <div className="flex gap-4 mt-8">
            <button className="bg-blue-600 text-white px-8 py-4 rounded-xl">
              Get Started
            </button>

            <button className="border border-blue-600 text-blue-600 px-8 py-4 rounded-xl">
              Watch Demo
            </button>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex justify-center">
          <div className="bg-white shadow-2xl rounded-3xl p-10 w-96 h-96 flex items-center justify-center">
            <span className="text-8xl">👨‍⚕️</span>
          </div>
        </div>

      </div>
    </section>
  );
}

export default Hero;