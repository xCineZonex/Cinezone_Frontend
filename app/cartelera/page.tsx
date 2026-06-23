import Navbar from '@/components/navbar';
import MovieGrid from '@/components/movie-grid';
import Footer from '@/components/footer';

export default function CarteleraPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-16 md:pt-20">
        <MovieGrid />
      </div>
      <Footer />
    </main>
  );
}
