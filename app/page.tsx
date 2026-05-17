import { Header } from '@/components/header';
import { HeroSection } from '@/components/hero-section';
import { FeaturesSection } from '@/components/features-section';
import { Footer } from '@/components/footer';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <Footer />
    </main>
  );
}
