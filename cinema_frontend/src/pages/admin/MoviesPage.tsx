import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { AdminLayout } from '../../components/layouts';
import { ConfirmModal } from '../../components/ui';
import { movieService } from '../../services';
import type { Movie, MovieStatus, MovieFilters } from '../../types/movie';
import { GENRE_OPTIONS, STATUS_OPTIONS } from '../../types/movie';

// Custom hook for debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Status badge component
const StatusBadge = ({ status }: { status: MovieStatus }) => {
  const config = {
    now_showing: { label: 'Now Showing', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
    upcoming: { label: 'Upcoming', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    closed: { label: 'Archived', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  };

  const { label, className } = config[status] || config.closed;

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${className}`}>
      {label}
    </span>
  );
};

export function MoviesPage() {
  const navigate = useNavigate();
  
  // State
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<MovieStatus | ''>('');
  const [genreFilter, setGenreFilter] = useState('');
  const [page, setPage] = useState(1);
  const [size] = useState(20);
  
  // Debounced search value
  const debouncedSearch = useDebounce(search, 400);
  
  // Delete modal
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; movie: Movie | null }>({
    open: false,
    movie: null,
  });

  // Fetch movies
  const fetchMovies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: MovieFilters = {
        page,
        size,
        search: debouncedSearch.trim() || undefined,
        status: statusFilter || undefined,
        genre: genreFilter || undefined,
      };
      
      const response = await movieService.getMovies(filters);
      setMovies(response.items);
      setTotalCount(response.total_count);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch movies');
    } finally {
      setLoading(false);
    }
  }, [page, size, debouncedSearch, statusFilter, genreFilter]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, genreFilter]);

  // Pagination
  const totalPages = Math.ceil(totalCount / size);
  const startItem = (page - 1) * size + 1;
  const endItem = Math.min(page * size, totalCount);

  // Delete handlers
  const handleDeleteClick = (movie: Movie) => {
    setDeleteModal({ open: true, movie });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.movie) return;
    
    const movieId = deleteModal.movie.id;
    
    try {
      setError(null);
      await movieService.deleteMovie(movieId);
      
      // Xóa movie khỏi state ngay lập tức (không cần fetch lại)
      setMovies((prev) => prev.filter((m) => m.id !== movieId));
      setTotalCount((prev) => prev - 1);
      
      setDeleteModal({ open: false, movie: null });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete movie');
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Generate page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 3) {
        pages.push(1, 2, 3, '...', totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', page, '...', totalPages);
      }
    }
    
    return pages;
  };

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Movies Management</h1>
            <p className="text-gray-400">
              Manage the movie catalog, including current and upcoming releases.
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/movies/add')}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            <Plus size={18} />
            Add New Movie
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-[#1a1a1a] rounded-xl p-6 mb-6 border border-gray-800">
          <h3 className="text-white font-medium mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Search by Title, Director..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#0d1117] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Genre Filter */}
            <select
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              className="px-4 py-2.5 bg-[#0d1117] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
            >
              <option value="">All Genres</option>
              {GENRE_OPTIONS.map((genre) => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as MovieStatus | '')}
              className="px-4 py-2.5 bg-[#0d1117] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Title</th>
                <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Genre</th>
                <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Release Date</th>
                <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Status</th>
                <th className="text-center px-6 py-4 text-gray-400 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                // Loading skeleton
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-800/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-16 bg-gray-700 rounded animate-pulse" />
                        <div className="h-4 w-32 bg-gray-700 rounded animate-pulse" />
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-700 rounded animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-700 rounded animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-6 w-20 bg-gray-700 rounded-full animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-8 w-16 bg-gray-700 rounded animate-pulse mx-auto" /></td>
                  </tr>
                ))
              ) : movies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No movies found. Try adjusting your filters or add a new movie.
                  </td>
                </tr>
              ) : (
                movies.map((movie) => (
                  <tr key={movie.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {movie.poster_url ? (
                          <img 
                            src={movie.poster_url} 
                            alt={movie.title}
                            className="w-12 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-16 bg-gray-700 rounded flex items-center justify-center text-gray-500 text-xs">
                            No img
                          </div>
                        )}
                        <span className="text-white font-medium">{movie.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{movie.genre}</td>
                    <td className="px-6 py-4 text-gray-300">{formatDate(movie.release_date)}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={movie.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate(`/admin/movies/edit/${movie.id}`)}
                          className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(movie)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalCount > 0 && (
            <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
              <p className="text-gray-400 text-sm">
                Showing <span className="text-white font-medium">{startItem}-{endItem}</span> of{' '}
                <span className="text-white font-medium">{totalCount}</span>
              </p>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {getPageNumbers().map((pageNum, i) => (
                  typeof pageNum === 'number' ? (
                    <button
                      key={i}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                        page === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ) : (
                    <span key={i} className="px-2 text-gray-500">...</span>
                  )
                ))}
                
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.open}
        title="Delete Movie"
        message={`Are you sure you want to delete "${deleteModal.movie?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteModal({ open: false, movie: null })}
        confirmVariant="danger"
      />
    </AdminLayout>
  );
}
