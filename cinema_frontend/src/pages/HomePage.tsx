import { useState, useEffect } from 'react';
import { MainLayout } from '../components/layouts';
import { HeroSection } from '../components/home/HeroSection';
import { SearchFilterBar } from '../components/home/SearchFilterBar';
import { NowShowingSection } from '../components/home/NowShowingSection';
import { PromoBanner } from '../components/home/PromoBanner';
import { ComingSoonSection } from '../components/home/ComingSoonSection';
import AdsModalWrapper from '../components/AdsModalWrapper';
import { movieService } from '../services';
import { useAds } from '../contexts';
import type { Movie as MovieType } from '../types/movie';

export function HomePage() {
  const [nowShowingMovies, setNowShowingMovies] = useState<MovieType[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<MovieType[]>([]);
  const [loading, setLoading] = useState(true);
  const { testShowAds } = useAds();

  useEffect(() => {
    // Check for home message from protected route
    const homeMessage = localStorage.getItem('homeMessage');
    if (homeMessage) {
      alert(homeMessage);
      localStorage.removeItem('homeMessage');
    }

    const fetchMovies = async () => {
      try {
        // Fetch now showing movies
        const nowShowingResponse = await movieService.getMovies({
          size: 20,
          status: 'now_showing'
        });
        setNowShowingMovies(nowShowingResponse.items);

        // Fetch upcoming movies
        const upcomingResponse = await movieService.getMovies({
          size: 20,
          status: 'upcoming'
        });
        setUpcomingMovies(upcomingResponse.items);
      } catch (error) {
        console.error('Failed to fetch movies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Hero Section */}
      <HeroSection />

      {/* Search & Filter Bar (Floating overlap) */}
      <SearchFilterBar />

      {/* Main Content */}
      <main className="flex-1 layout-container max-w-[1280px] mx-auto w-full px-6 py-12 flex flex-col gap-16">
        {/* Now Showing Section */}
        <NowShowingSection movies={nowShowingMovies} />

        {/* Promo Banner */}
        <PromoBanner />

        {/* Coming Soon Section */}
        <ComingSoonSection movies={upcomingMovies} />
      </main>

      {/* Test button for ads - chỉ hiển thị trong development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={testShowAds}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test Ads Modal
          </button>
        </div>
      )}

      {/* Ads Modal - chỉ hiển thị trên trang Home */}
      <AdsModalWrapper />
    </MainLayout>
  );
}

export default HomePage;

