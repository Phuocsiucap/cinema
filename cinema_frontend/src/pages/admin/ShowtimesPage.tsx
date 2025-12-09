import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Calendar, 
  Clock, 
  MapPin, 
  Film, 
  Trash2, 
  Edit2, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  X,
  Building2,
  Search,
  ArrowLeft
} from 'lucide-react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { ConfirmModal } from '../../components/ui';
import { showtimeService, type Showtime, type ShowtimeCreate } from '../../services/showtimeService';
import { movieService } from '../../services/movieService';
import { cinemaService } from '../../services/cinemaService';
import type { Movie } from '../../types/movie';

interface Cinema {
  id: string;
  name: string;
  city: string;
  rooms: { id: string; name: string }[];
}

type ViewMode = 'movie' | 'room';

export function ShowtimesPage() {
  const [searchParams] = useSearchParams();
  
  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('movie');
  
  // Data
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  
  // Movie search
  const [movieSearchQuery, setMovieSearchQuery] = useState('');
  const [movieSearchResults, setMovieSearchResults] = useState<Movie[]>([]);
  const [isSearchingMovies, setIsSearchingMovies] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [cachedSearchQuery, setCachedSearchQuery] = useState('');
  const [cachedSearchResults, setCachedSearchResults] = useState<Movie[]>([]);
  const movieSearchRef = useRef<HTMLDivElement>(null);
  
  // Selected filters
  const [selectedCinemaId, setSelectedCinemaId] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  
  // Week navigation for room view
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCinemas, setIsLoadingCinemas] = useState(true);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; showtime: Showtime | null }>({
    isOpen: false,
    showtime: null,
  });
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [error, setError] = useState<string | null>(null);

  // Debounced movie search
  useEffect(() => {
    const searchMovies = async () => {
      if (movieSearchQuery.trim().length < 2) {
        setMovieSearchResults([]);
        return;
      }
      
      setIsSearchingMovies(true);
      try {
        const response = await movieService.getMovies({ search: movieSearchQuery, page: 1, size: 10 });
        setMovieSearchResults(response.items);
        // Cache kết quả search
        setCachedSearchQuery(movieSearchQuery);
        setCachedSearchResults(response.items);
      } catch (err) {
        console.error('Failed to search movies:', err);
      } finally {
        setIsSearchingMovies(false);
      }
    };

    const debounceTimer = setTimeout(searchMovies, 300);
    return () => clearTimeout(debounceTimer);
  }, [movieSearchQuery]);

  // Load cinemas khi mount
  useEffect(() => {
    const loadCinemas = async () => {
      try {
        setIsLoadingCinemas(true);
        const cinemasData = await cinemaService.getCinemas();
        setCinemas(cinemasData);
        if (cinemasData.length > 0) {
          setSelectedCinemaId(cinemasData[0].id);
          if (cinemasData[0].rooms?.length > 0) {
            setSelectedRoomId(cinemasData[0].rooms[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load cinemas:', err);
      } finally {
        setIsLoadingCinemas(false);
      }
    };

    loadCinemas();
  }, []);

  // Check for movieId in URL params
  useEffect(() => {
    const movieIdFromUrl = searchParams.get('movieId');
    if (movieIdFromUrl && !selectedMovie) {
      // Load movie by ID
      movieService.getMovie(movieIdFromUrl).then(movie => {
        setSelectedMovie(movie);
        setMovieSearchQuery(movie.title);
      }).catch(console.error);
    }
  }, [searchParams]);

  // Load showtimes khi thay đổi filter
  const fetchShowtimes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (viewMode === 'movie' && selectedMovie) {
        const data = await showtimeService.getShowtimesByMovie(selectedMovie.id);
        setShowtimes(data);
      } else if (viewMode === 'room' && selectedRoomId) {
        const startDate = currentWeekStart.toISOString().split('T')[0];
        const endDate = new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const data = await showtimeService.getShowtimesByRoom(selectedRoomId, startDate, endDate);
        setShowtimes(data);
      } else {
        setShowtimes([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load showtimes');
    } finally {
      setIsLoading(false);
    }
  }, [viewMode, selectedMovie, selectedRoomId, currentWeekStart]);

  useEffect(() => {
    if ((viewMode === 'movie' && selectedMovie) || (viewMode === 'room' && selectedRoomId)) {
      fetchShowtimes();
    }
  }, [fetchShowtimes]);

  // Handle cinema change - update rooms
  useEffect(() => {
    const cinema = cinemas.find(c => c.id === selectedCinemaId);
    if (cinema && cinema.rooms?.length > 0) {
      setSelectedRoomId(cinema.rooms[0].id);
    } else {
      setSelectedRoomId('');
    }
  }, [selectedCinemaId, cinemas]);

  const handleSelectMovie = (movie: Movie) => {
    setSelectedMovie(movie);
  };

  const handleBackToSearch = () => {
    setSelectedMovie(null);
    // Khôi phục lại kết quả search đã cache
    if (cachedSearchQuery) {
      setMovieSearchQuery(cachedSearchQuery);
      setMovieSearchResults(cachedSearchResults);
    }
    setShowtimes([]);
  };

  const handleClearSearch = () => {
    setMovieSearchQuery('');
    setMovieSearchResults([]);
    setCachedSearchQuery('');
    setCachedSearchResults([]);
  };

  const handleDelete = async () => {
    if (!deleteModal.showtime) return;

    setIsDeleting(true);
    try {
      await showtimeService.deleteShowtime(deleteModal.showtime.id);
      setDeleteModal({ isOpen: false, showtime: null });
      fetchShowtimes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete showtime');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Get week days for calendar view
  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const selectedCinema = cinemas.find(c => c.id === selectedCinemaId);

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white">Manage Showtimes</h1>
              <p className="text-gray-400 mt-1">Schedule, edit, and view movie showtimes for all cinemas.</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus size={18} />
              Add New Showtime
            </button>
          </div>

          {/* View Mode Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setViewMode('movie')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'movie'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <Film size={16} className="inline mr-2" />
              By Movie
            </button>
            <button
              onClick={() => setViewMode('room')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'room'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <Building2 size={16} className="inline mr-2" />
              By Room (Calendar)
            </button>
          </div>

          {/* Filters - only show when in room view or no movie selected */}
          {(viewMode === 'room' || (viewMode === 'movie' && !selectedMovie)) && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
              {viewMode === 'movie' ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="text-gray-400 text-sm whitespace-nowrap">Search Movie:</label>
                    <div className="relative flex-1 max-w-md" ref={movieSearchRef}>
                      <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                          type="text"
                          value={movieSearchQuery}
                          onChange={(e) => setMovieSearchQuery(e.target.value)}
                          placeholder="Type to search movies..."
                          className="w-full pl-10 pr-10 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {isSearchingMovies && (
                          <Loader2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 animate-spin" />
                        )}
                        {movieSearchQuery && !isSearchingMovies && (
                          <button
                            onClick={handleClearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-gray-400 text-sm">Cinema:</label>
                    <select
                      value={selectedCinemaId}
                      onChange={(e) => setSelectedCinemaId(e.target.value)}
                      disabled={isLoadingCinemas}
                      className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {cinemas.map((cinema) => (
                        <option key={cinema.id} value={cinema.id}>
                          {cinema.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-gray-400 text-sm">Room:</label>
                    <select
                      value={selectedRoomId}
                      onChange={(e) => setSelectedRoomId(e.target.value)}
                      className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {selectedCinema?.rooms?.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400">
              {error}
            </div>
          )}

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="animate-spin text-blue-500" size={48} />
            </div>
          ) : viewMode === 'movie' ? (
            // Movie View - List
            <>
              {!selectedMovie ? (
                // No movie selected - show search results or instructions
                <>
                  {movieSearchQuery.length < 2 ? (
                    <div className="text-center py-16 text-gray-400">
                      <Search size={48} className="mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Search and select a movie to view its showtimes</p>
                      <p className="text-sm mt-2">Type at least 2 characters to search</p>
                    </div>
                  ) : isSearchingMovies ? (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 className="animate-spin text-blue-500" size={48} />
                    </div>
                  ) : movieSearchResults.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                      <Film size={48} className="mx-auto mb-4 opacity-50" />
                      <p className="text-lg">No movies found for "{movieSearchQuery}"</p>
                      <p className="text-sm mt-2">Try a different search term</p>
                    </div>
                  ) : (
                    // Danh sách kết quả search - hiển thị như grid items
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {movieSearchResults.map((movie) => (
                        <button
                          key={movie.id}
                          onClick={() => handleSelectMovie(movie)}
                          className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 hover:border-blue-500/50 transition-all text-left group"
                        >
                          <div className="flex gap-4">
                            {movie.poster_url ? (
                              <img
                                src={movie.poster_url}
                                alt={movie.title}
                                className="w-20 h-28 object-cover rounded-lg flex-shrink-0"
                              />
                            ) : (
                              <div className="w-20 h-28 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Film size={24} className="text-gray-500" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-white font-semibold truncate group-hover:text-blue-400 transition-colors">
                                {movie.title}
                              </h3>
                              <p className="text-gray-400 text-sm mt-1">
                                {movie.duration_minutes} min
                              </p>
                              <p className="text-gray-500 text-sm truncate">
                                {movie.genre}
                              </p>
                              <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs ${
                                movie.status === 'now_showing' ? 'bg-green-500/20 text-green-400' :
                                movie.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-gray-500/20 text-gray-400'
                              }`}>
                                {movie.status === 'now_showing' ? 'Now Showing' :
                                 movie.status === 'upcoming' ? 'Upcoming' : 'Closed'}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Back button + Selected Movie Info */}
                  <button
                    onClick={handleBackToSearch}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
                  >
                    <ArrowLeft size={18} />
                    <span>Back to search results</span>
                  </button>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 flex gap-4">
                    {selectedMovie.poster_url && (
                      <img
                        src={selectedMovie.poster_url}
                        alt={selectedMovie.title}
                        className="w-24 h-36 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-white">{selectedMovie.title}</h2>
                      <p className="text-gray-400 mt-1 line-clamp-2">{selectedMovie.synopsis}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span><Clock size={14} className="inline mr-1" />{selectedMovie.duration_minutes} min</span>
                        <span>{selectedMovie.genre}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          selectedMovie.status === 'now_showing' ? 'bg-green-500/20 text-green-400' :
                          selectedMovie.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {selectedMovie.status === 'now_showing' ? 'Now Showing' :
                           selectedMovie.status === 'upcoming' ? 'Upcoming' : 'Closed'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="self-start flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <Plus size={16} />
                      Add Showtime
                    </button>
                  </div>

                  {showtimes.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No showtimes found for this movie.</p>
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="mt-4 text-blue-400 hover:text-blue-300"
                      >
                        Add first showtime
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-white/5 border-b border-white/10">
                          <tr>
                            <th className="px-4 py-3 text-left text-gray-400 text-sm font-medium">Cinema</th>
                            <th className="px-4 py-3 text-left text-gray-400 text-sm font-medium">Room</th>
                            <th className="px-4 py-3 text-left text-gray-400 text-sm font-medium">Date</th>
                            <th className="px-4 py-3 text-left text-gray-400 text-sm font-medium">Time</th>
                            <th className="px-4 py-3 text-left text-gray-400 text-sm font-medium">Price</th>
                            <th className="px-4 py-3 text-left text-gray-400 text-sm font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {showtimes.map((showtime) => (
                            <tr key={showtime.id} className="border-t border-white/10 hover:bg-white/5">
                              <td className="px-4 py-3 text-white">
                                {showtime.room?.cinema?.name || '-'}
                              </td>
                              <td className="px-4 py-3 text-gray-300">
                                {showtime.room?.name || '-'}
                              </td>
                              <td className="px-4 py-3 text-gray-300">
                                {formatDate(showtime.start_time)}
                              </td>
                              <td className="px-4 py-3 text-white font-medium">
                                {formatTime(showtime.start_time)} - {formatTime(showtime.end_time)}
                              </td>
                              <td className="px-4 py-3 text-green-400">
                                {formatPrice(showtime.price)}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <button className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors">
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    onClick={() => setDeleteModal({ isOpen: true, showtime })}
                                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            // Room View - Calendar
            <>
              {/* Week Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setCurrentWeekStart(new Date(currentWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000))}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <h3 className="text-white font-medium">
                  {currentWeekStart.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' })} - {' '}
                  {new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </h3>
                <button
                  onClick={() => setCurrentWeekStart(new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000))}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <div className="grid grid-cols-7 border-b border-white/10">
                  {getWeekDays().map((day, idx) => {
                    const isToday = day.toDateString() === new Date().toDateString();
                    return (
                      <div
                        key={idx}
                        className={`p-3 text-center border-r border-white/10 last:border-r-0 ${
                          isToday ? 'bg-blue-600/20' : ''
                        }`}
                      >
                        <p className={`text-sm font-medium ${isToday ? 'text-blue-400' : 'text-gray-400'}`}>
                          {day.toLocaleDateString('vi-VN', { weekday: 'short' })}
                        </p>
                        <p className={`text-lg font-bold ${isToday ? 'text-blue-400' : 'text-white'}`}>
                          {day.getDate()}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-7 min-h-[300px]">
                  {getWeekDays().map((day, idx) => {
                    const dayShowtimes = showtimes.filter(s => {
                      const showDate = new Date(s.start_time);
                      return showDate.toDateString() === day.toDateString();
                    });
                    return (
                      <div key={idx} className="border-r border-white/10 last:border-r-0 p-2 space-y-2">
                        {dayShowtimes.map((showtime) => (
                          <div
                            key={showtime.id}
                            className="bg-blue-600/30 border border-blue-500/50 rounded p-2 text-xs cursor-pointer hover:bg-blue-600/50 transition-colors"
                            onClick={() => setSelectedShowtime(showtime)}
                          >
                            <p className="text-white font-medium truncate">{showtime.movie?.title}</p>
                            <p className="text-blue-300">
                              {formatTime(showtime.start_time)} - {formatTime(showtime.end_time)}
                            </p>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Showtime Modal */}
      {showAddModal && (
        <AddShowtimeModal
          cinemas={cinemas}
          defaultMovie={viewMode === 'movie' ? selectedMovie : null}
          defaultRoomId={viewMode === 'room' ? selectedRoomId : ''}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchShowtimes();
          }}
        />
      )}

      {/* Showtime Detail Modal */}
      {selectedShowtime && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setSelectedShowtime(null)}
        >
          <div 
            className="bg-gray-900 rounded-2xl max-w-md w-full mx-4 border border-gray-700 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Movie Poster Header */}
            {selectedShowtime.movie?.poster_url && (
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={selectedShowtime.movie.poster_url} 
                  alt={selectedShowtime.movie.title}
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
                <button
                  onClick={() => setSelectedShowtime(null)}
                  className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            <div className="p-6">
              {/* Movie Info */}
              <div className="flex gap-4 mb-6">
                {!selectedShowtime.movie?.poster_url && (
                  <div className="w-20 h-28 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Film size={24} className="text-gray-500" />
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white">{selectedShowtime.movie?.title || 'Unknown Movie'}</h2>
                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {selectedShowtime.movie?.duration_minutes || 0} min
                    </span>
                  </div>
                </div>
              </div>

              {/* Showtime Details - Focus on time */}
              <div className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-4 mb-4">
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-1">Showtime</p>
                  <p className="text-3xl font-bold text-blue-400">
                    {formatTime(selectedShowtime.start_time)} - {formatTime(selectedShowtime.end_time)}
                  </p>
                  <p className="text-white mt-2">
                    {formatDate(selectedShowtime.start_time)}
                  </p>
                </div>
              </div>

              {/* Location & Price */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">Cinema</p>
                  <p className="text-white font-medium">{selectedShowtime.room?.cinema?.name || '-'}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">Room</p>
                  <p className="text-white font-medium">{selectedShowtime.room?.name || '-'}</p>
                </div>
              </div>

              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Ticket Price</span>
                  <span className="text-green-400 text-xl font-bold">{formatPrice(selectedShowtime.price)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setDeleteModal({ isOpen: true, showtime: selectedShowtime });
                    setSelectedShowtime(null);
                  }}
                  className="flex-1 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
                <button
                  onClick={() => setSelectedShowtime(null)}
                  className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, showtime: null })}
        onConfirm={handleDelete}
        title="Delete Showtime"
        message={`Are you sure you want to delete this showtime? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={isDeleting}
        variant="danger"
      />
    </AdminLayout>
  );
}

// Add Showtime Modal Component
interface AddShowtimeModalProps {
  cinemas: Cinema[];
  defaultMovie?: Movie | null;
  defaultRoomId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

function AddShowtimeModal({ cinemas, defaultMovie, defaultRoomId, onClose, onSuccess }: AddShowtimeModalProps) {
  const [formData, setFormData] = useState<ShowtimeCreate>({
    movie_id: defaultMovie?.id || '',
    room_id: defaultRoomId || '',
    start_time: '',
    price: 85000,
  });
  const [selectedCinemaId, setSelectedCinemaId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Movie search in modal (only if no defaultMovie)
  const [movieSearchQuery, setMovieSearchQuery] = useState(defaultMovie?.title || '');
  const [movieSearchResults, setMovieSearchResults] = useState<Movie[]>([]);
  const [isSearchingMovies, setIsSearchingMovies] = useState(false);
  const [showMovieDropdown, setShowMovieDropdown] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(defaultMovie || null);
  const movieSearchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (movieSearchRef.current && !movieSearchRef.current.contains(event.target as Node)) {
        setShowMovieDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced movie search (only if no defaultMovie)
  useEffect(() => {
    // Skip search if we already have a default movie
    if (defaultMovie) return;
    
    const searchMovies = async () => {
      if (movieSearchQuery.trim().length < 2) {
        setMovieSearchResults([]);
        return;
      }
      
      setIsSearchingMovies(true);
      try {
        const response = await movieService.getMovies({ search: movieSearchQuery, page: 1, size: 10 });
        setMovieSearchResults(response.items);
        setShowMovieDropdown(true);
      } catch (err) {
        console.error('Failed to search movies:', err);
      } finally {
        setIsSearchingMovies(false);
      }
    };

    const debounceTimer = setTimeout(searchMovies, 300);
    return () => clearTimeout(debounceTimer);
  }, [movieSearchQuery, defaultMovie]);

  // Initialize cinema based on defaultRoomId
  useEffect(() => {
    if (defaultRoomId) {
      const cinema = cinemas.find(c => c.rooms?.some(r => r.id === defaultRoomId));
      if (cinema) {
        setSelectedCinemaId(cinema.id);
      }
    } else if (cinemas.length > 0) {
      setSelectedCinemaId(cinemas[0].id);
      if (cinemas[0].rooms?.length > 0) {
        setFormData(prev => ({ ...prev, room_id: cinemas[0].rooms[0].id }));
      }
    }
  }, [cinemas, defaultRoomId]);

  const selectedCinema = cinemas.find(c => c.id === selectedCinemaId);

  const handleSelectMovie = (movie: Movie) => {
    setSelectedMovie(movie);
    setMovieSearchQuery(movie.title);
    setFormData(prev => ({ ...prev, movie_id: movie.id }));
    setShowMovieDropdown(false);
  };

  const handleCinemaChange = (cinemaId: string) => {
    setSelectedCinemaId(cinemaId);
    const cinema = cinemas.find(c => c.id === cinemaId);
    if (cinema && cinema.rooms?.length > 0) {
      setFormData(prev => ({ ...prev, room_id: cinema.rooms[0].id }));
    } else {
      setFormData(prev => ({ ...prev, room_id: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.movie_id || !formData.room_id || !formData.start_time) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await showtimeService.createShowtime({
        ...formData,
        start_time: new Date(formData.start_time).toISOString(),
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create showtime');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900">
          <h3 className="text-lg font-semibold text-white">Add New Showtime</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Movie - Show info if defaultMovie, otherwise show search */}
          {defaultMovie ? (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Film size={14} className="inline mr-1" />
                Movie
              </label>
              <div className="flex items-center gap-3 p-3 bg-gray-800 border border-gray-700 rounded-lg">
                {defaultMovie.poster_url ? (
                  <img
                    src={defaultMovie.poster_url}
                    alt={defaultMovie.title}
                    className="w-10 h-14 object-cover rounded"
                  />
                ) : (
                  <div className="w-10 h-14 bg-gray-700 rounded flex items-center justify-center">
                    <Film size={16} className="text-gray-500" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-white font-medium">{defaultMovie.title}</p>
                  <p className="text-gray-400 text-sm">{defaultMovie.duration_minutes} min • {defaultMovie.genre}</p>
                </div>
                <span className="text-green-400">✓</span>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Film size={14} className="inline mr-1" />
                Movie *
              </label>
              <div className="relative" ref={movieSearchRef}>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={movieSearchQuery}
                    onChange={(e) => {
                      setMovieSearchQuery(e.target.value);
                      if (selectedMovie && e.target.value !== selectedMovie.title) {
                        setSelectedMovie(null);
                        setFormData(prev => ({ ...prev, movie_id: '' }));
                      }
                    }}
                    onFocus={() => movieSearchResults.length > 0 && setShowMovieDropdown(true)}
                    placeholder="Search movie..."
                    className="w-full pl-9 pr-10 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {isSearchingMovies && (
                    <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 animate-spin" />
                  )}
                  {selectedMovie && !isSearchingMovies && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400">✓</span>
                  )}
                </div>
                
                {/* Search Results Dropdown */}
                {showMovieDropdown && movieSearchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-auto">
                    {movieSearchResults.map((movie) => (
                      <button
                        type="button"
                        key={movie.id}
                        onClick={() => handleSelectMovie(movie)}
                        className="w-full flex items-center gap-3 p-2 hover:bg-gray-700 transition-colors text-left"
                      >
                        {movie.poster_url ? (
                          <img
                            src={movie.poster_url}
                            alt={movie.title}
                            className="w-8 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-8 h-12 bg-gray-700 rounded flex items-center justify-center">
                            <Film size={12} className="text-gray-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{movie.title}</p>
                          <p className="text-gray-400 text-xs">{movie.duration_minutes} min</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedMovie && (
                <p className="mt-1 text-xs text-gray-500">
                  Duration: {selectedMovie.duration_minutes} min • {selectedMovie.genre}
                </p>
              )}
            </div>
          )}

          {/* Cinema */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Building2 size={14} className="inline mr-1" />
              Cinema *
            </label>
            <select
              value={selectedCinemaId}
              onChange={(e) => handleCinemaChange(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {cinemas.map((cinema) => (
                <option key={cinema.id} value={cinema.id}>
                  {cinema.name} - {cinema.city}
                </option>
              ))}
            </select>
          </div>

          {/* Room */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <MapPin size={14} className="inline mr-1" />
              Room *
            </label>
            <select
              value={formData.room_id}
              onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select room --</option>
              {selectedCinema?.rooms?.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Clock size={14} className="inline mr-1" />
              Start Time *
            </label>
            <input
              type="datetime-local"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Price (VND) *
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              required
              min={0}
              step={1000}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.movie_id}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Add Showtime
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
