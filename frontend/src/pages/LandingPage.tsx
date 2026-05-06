import LandingNav from '../components/landing/LandingNav';
import HeroSection from '../components/landing/HeroSection';
import StatsBar from '../components/landing/StatsBar';
import FeaturesSection from '../components/landing/FeaturesSection';
import AISection from '../components/landing/AISection';
import AudienceSection from '../components/landing/AudienceSection';
import FinalCTA from '../components/landing/FinalCTA';
import LandingFooter from '../components/landing/LandingFooter';

export default function LandingPage() {
  return (
    <div className="bg-[#070d1a] min-h-screen" data-testid="landing-page">
      <LandingNav />
      <HeroSection />
      <StatsBar />
      <FeaturesSection />
      <AISection />
      <AudienceSection />
      <FinalCTA />
      <LandingFooter />
    </div>
  );
}
