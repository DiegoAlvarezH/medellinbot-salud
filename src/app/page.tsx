import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { ContactSection } from '@/components/landing/ContactSection';

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ContactSection />
    </>
  );
}
