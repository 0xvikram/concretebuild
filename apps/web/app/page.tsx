import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import Roadmap from "./components/Roadmap";
import TokenPricing from "./components/TokenPricing";
import TokenAndPartners from "./components/TokenAndPartners";
import WaitlistForm from "./components/WaitlistForm";
import Footer from "./components/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Roadmap />
        <TokenPricing />
        <TokenAndPartners />
        <WaitlistForm />
      </main>
      <Footer />
    </div>
  );
}
