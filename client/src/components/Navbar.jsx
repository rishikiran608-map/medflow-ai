function Navbar() {
  return (
    <nav className="flex justify-between items-center px-10 py-5 shadow-md">
      <h1 className="text-3xl font-bold text-blue-600">
        MedFlow AI
      </h1>

      <div className="flex gap-8">
        <a href="#">Home</a>
        <a href="#">Features</a>
        <a href="#">About</a>
        <a href="#">Contact</a>
      </div>

      <button className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700">
        Login
      </button>
    </nav>
  );
}

export default Navbar;