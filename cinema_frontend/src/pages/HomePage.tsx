import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2 } from 'lucide-react';
import { MainLayout } from '../components/layouts';
import { HeroBanner, MovieCarousel } from '../components/home';
import type { Movie } from '../components/home';
import { movieService } from '../services';
import type { Movie as MovieType } from '../types/movie';

// Convert API movie to component movie format
const mapMovieToCard = (movie: MovieType): Movie => ({
  id: movie.id,
  title: movie.title,
  posterUrl: movie.poster_url || 'https://via.placeholder.com/300x450?text=No+Poster',
  releaseDate: movie.release_date,
  rating: movie.imdb_rating,
});

export function HomePage() {
  const navigate = useNavigate();
  const [newReleases, setNewReleases] = useState<Movie[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [, setLoading] = useState(true);

  useEffect(() => {
    // Check for home message from protected route
    const homeMessage = localStorage.getItem('homeMessage');
    if (homeMessage) {
      alert(homeMessage);
      localStorage.removeItem('homeMessage');
    }

    const fetchMovies = async () => {
      try {
        // Lấy phim đang chiếu
        const nowShowingResponse = await movieService.getMovies({ 
          size: 20,
          status: 'now_showing' 
        });
        const nowShowingMovies = nowShowingResponse.items.map(mapMovieToCard);
        setNewReleases(nowShowingMovies);

        // Lấy phim sắp chiếu
        const upcomingResponse = await movieService.getMovies({ 
          size: 20,
          status: 'upcoming' 
        });
        const upcomingMoviesData = upcomingResponse.items.map(mapMovieToCard);
        setUpcomingMovies(upcomingMoviesData);
      } catch (error) {
        console.error('Failed to fetch movies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await movieService.getMovies({ 
          search: searchQuery, 
          size: 20 
        });
        const movies = response.items.map(mapMovieToCard);
        setSearchResults(movies);
      } catch (error) {
        console.error('Failed to search movies:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleMovieClick = (movieId: number | string) => {
    navigate(`/movie/${movieId}`);
  };

  return (
    <MainLayout>
      {/* Hero Banner */}
      <HeroBanner />

      {/* Search Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="relative max-w-2xl mx-auto">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search for movies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-12 py-4 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600 transition-colors"
          />
          {isSearching && (
            <Loader2 size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
          )}
          {searchQuery && !isSearching && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div className="mt-6">
            {isSearching ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-red-600 border-t-transparent"></div>
                <p className="text-gray-400 mt-4">Searching...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <>
                <h2 className="text-2xl font-bold text-white mb-4">
                  Search Results ({searchResults.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {searchResults.map((movie) => (
                    <div
                      key={movie.id}
                      onClick={() => handleMovieClick(movie.id)}
                      className="group cursor-pointer"
                    >
                      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-gray-800">
                        <img
                          src={movie.posterUrl}
                          alt={movie.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        {movie.rating && (
                          <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 rounded-md text-xs font-bold">
                            ⭐ {movie.rating}
                          </div>
                        )}
                      </div>
                      <h3 className="text-white font-medium mt-2 line-clamp-2">
                        {movie.title}
                      </h3>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No movies found for "{searchQuery}"</p>
                <p className="text-gray-500 text-sm mt-2">Try searching with different keywords</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Releases */}
      <MovieCarousel
        title="New Releases"
        movies={newReleases}
        variant="release"
      />

      {/* Popular Picks */}
      <MovieCarousel
        title="Popular Picks"
        movies={upcomingMovies}
        variant="popular"
      />
    </MainLayout>
  );
}

export default HomePage;
