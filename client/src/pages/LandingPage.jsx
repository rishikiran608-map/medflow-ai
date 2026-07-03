import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Stats from "../components/Stats";
import DashboardPreview from "../components/DashboardPreview";
function LandingPage() {
  return (
  <div className="min-h-screen bg-blue-50">
    <Navbar />
    <Hero />
    <Features />
    <Stats />
    <DashboardPreview />
  </div>
  
);
}

export default LandingPage;