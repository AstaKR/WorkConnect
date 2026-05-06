import LandingNav from '../components/landing/LandingNav';
import HeroSection from '../components/landing/HeroSection';
import StatsBar from '../components/landing/StatsBar';
import FeaturesSection from '../components/landing/FeaturesSection';

export default function LandingPage() {
  return (
    <div className="bg-[#070d1a] min-h-screen" data-testid="landing-page">
      <LandingNav />
      <HeroSection />
      <StatsBar />
      <FeaturesSection />
    </div>
  );
}
