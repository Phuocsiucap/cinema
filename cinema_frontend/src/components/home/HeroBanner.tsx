import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { movieService } from '../../services';
import type { Movie } from '../../types/movie';

interface BannerSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  link: string;
}

// Random descriptions for banner
const bannerDescriptions = [
  'Book Your Tickets Now!',
  'Now Showing in Theaters.',
  'Experience it in IMAX.',
  'Don\'t Miss This Epic Adventure!',
  'Limited Time Only.',
  'Get Your Seats Today!',
  'A Must-Watch Film.',
  'Coming to a Theater Near You.',
];

const getRandomDescription = () => {
  return bannerDescriptions[Math.floor(Math.random() * bannerDescriptions.length)];
};

export function HeroBanner() {
  const [slides, setSlides] = useState<BannerSlide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch movies for banner
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await movieService.getMovies({ page: 1, size: 5, status: 'now_showing' });
        const bannerSlides: BannerSlide[] = response.items.map((movie: Movie) => ({
          id: movie.id,
          title: movie.title,
          subtitle: movie.synopsis?.substring(0, 100) + (movie.synopsis && movie.synopsis.length > 100 ? '...' : '') || '',
          description: getRandomDescription(),
          imageUrl: movie.background_url || movie.poster_url || '',
          link: `/movie/${movie.id}`,
        }));
        setSlides(bannerSlides);
      } catch (error) {
        console.error('Error fetching banner movies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  // Auto slide
  useEffect(() => {
    if (slides.length === 0) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  // Loading state
  if (loading) {
    return (
      <section className="relative h-[500px] md:h-[600px] overflow-hidden bg-gray-900 animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/70 to-transparent" />
      </section>
    );
  }

  // No slides
  if (slides.length === 0) {
    return null;
  }

  const slide = slides[currentSlide];

  return (
    <section className="relative h-[500px] md:h-[600px] overflow-hidden">
      {/* Background Image - Full width, fixed height */}
      <div className="absolute inset-0">
        <img
          src={slide.imageUrl}
          alt={slide.title}
          className="w-full h-full object-cover object-center transition-all duration-700"
        />
        {/* Gradient Overlay - Nhẹ hơn để ảnh rõ hơn */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950/80 via-gray-950/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center">
        <div className="max-w-xl">
          <span className="inline-block text-red-500 text-sm font-semibold tracking-wider uppercase mb-4">
            Now Playing
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2 leading-tight">
            {slide.title}
            <br />
            <span className="text-white/90">{slide.subtitle}</span>
          </h1>
          <p className="text-gray-300 text-lg mb-6">
            {slide.description}
          </p>
          <Link
            to={slide.link}
            className="inline-flex items-center px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
          >
            BOOK NOW
          </Link>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition-colors"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition-colors"
      >
        <ChevronRight size={24} />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentSlide
                ? 'w-6 bg-white'
                : 'bg-white/50 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
