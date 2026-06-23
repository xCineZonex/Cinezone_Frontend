import Navbar from '@/components/navbar';
import HeroSection from '@/components/HeroSection';
import MovieGrid from '@/components/movie-grid';
import FeaturesSection from '@/components/features-section';
import SedesSection from '@/components/sedes-section';
import Footer from '@/components/footer';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-16 md:pt-20">
        <HeroSection />
        <MovieGrid />
        <FeaturesSection />
        <SedesSection />
      </div>
      <Footer />
    </main>
  );
}
