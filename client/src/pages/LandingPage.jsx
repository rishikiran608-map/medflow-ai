import Hero from "../components/Hero";
import Features from "../components/Features";
import HowItWorks from "../components/HowItWorks";
import Stats from "../components/Stats";
import DashboardPreview from "../components/DashboardPreview";
import About from "../components/About";
import Contact from "../components/Contact";

function LandingPage() {
  return (
  <div className="min-h-screen bg-blue-50">
    <Hero />
    <Features />
    <HowItWorks />
    <Stats />
    <DashboardPreview />
    <About />
    <Contact />
  </div>
  
);
}

export default LandingPage;