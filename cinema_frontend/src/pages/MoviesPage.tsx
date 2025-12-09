import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Film, 
  Search, 
  Star, 
  Clock, 
  ChevronRight
} from 'lucide-react';
import { MainLayout } from '../components/layouts';
import { movieService } from '../services';
import type { Movie } from '../types/movie';
import { GENRE_OPTIONS, STATUS_OPTIONS } from '../types/movie';

export function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'upcoming' | 'now_showing' | 'closed' | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    loadMovies();
  }, [searchQuery, selectedGenre, selectedStatus, page]);

  const loadMovies = async () => {
    setIsLoading(true);
    try {
      const response = await movieService.getMovies({
        search: searchQuery || undefined,
        genre: selectedGenre || undefined,
        status: (selectedStatus as any) || undefined,
        page,
        size: 12,
      });
      setMovies(response.items);
      setTotalPages(Math.ceil(response.total_count / 12));
    } catch (err) {
      console.error('Failed to load movies:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'now_showing':
        return { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Now Showing' };
      case 'upcoming':
        return { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Coming Soon' };
      case 'closed':
        return { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Closed' };
      default:
        return { bg: 'bg-gray-500/20', text: 'text-gray-400', label: status };
    }
  };

  return (
    <MainLayout>
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white">Phim</h1>
              <p className="text-gray-400 mt-2">Discover the latest and most popular movies</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative sm:col-span-3">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search movies..."
                className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Genre Filter */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Genre</label>
              <select
                value={selectedGenre}
                onChange={(e) => {
                  setSelectedGenre(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">All Genres</option>
                {GENRE_OPTIONS.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value as any);
                  setPage(1);
                }}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">All</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">&nbsp;</label>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedGenre('');
                  setSelectedStatus('');
                  setPage(1);
                }}
                className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Movies Grid */}
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
            </div>
          ) : movies.length === 0 ? (
            <div className="text-center py-20">
              <Film size={48} className="mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 text-lg">No movies found</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {movies.map((movie) => {
                  const badge = getStatusBadge(movie.status);
                  return (
                    <Link
                      key={movie.id}
                      to={`/movie/${movie.id}`}
                      className="group"
                    >
                      <div className="relative overflow-hidden rounded-lg bg-gray-800 aspect-[2/3] mb-3">
                        {movie.poster_url ? (
                          <img
                            src={movie.poster_url}
                            alt={movie.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Film size={48} className="text-gray-600" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                          <span className="text-white font-medium flex items-center gap-2">
                            <ChevronRight size={18} />
                            View Details
                          </span>
                        </div>
                        <div className="absolute top-3 right-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                            {badge.label}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-white font-semibold line-clamp-2 group-hover:text-red-400 transition-colors">
                          {movie.title}
                        </h3>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Clock size={14} />
                          <span>{movie.duration_minutes} min</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {movie.imdb_rating && (
                            <div className="flex items-center gap-1 text-yellow-400">
                              <Star size={14} fill="currentColor" />
                              <span className="text-xs">{movie.imdb_rating}</span>
                            </div>
                          )}
                          {movie.genre && (
                            <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-800 rounded">
                              {movie.genre}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        page === p
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-800 hover:bg-gray-700 text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50"
                  >
                    Sau
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </MainLayout>
  );
}

export default MoviesPage;
