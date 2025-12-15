import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock,
  MapPin,
  Loader2,
  Star,
  Minus,
  Plus,
  Calendar
} from 'lucide-react';
import { MainLayout } from '../components/layouts';
import { movieService } from '../services/movieService';
import { showtimeService, type Showtime } from '../services/showtimeService';
import type { Movie } from '../types/movie';

interface GroupedByDate {
  date: Date;
  dateStr: string;
  cinemas: {
    id: string;
    name: string;
    city: string;
    rooms: {
      id: string;
      name: string;
      showtimes: Showtime[];
    }[];
  }[];
}

export default function MovieBookingPage() {
  const { id: movieId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Data states
  const [movie, setMovie] = useState<Movie | null>(null);
  const [allShowtimes, setAllShowtimes] = useState<Showtime[]>([]);

  // Selection states
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(null);
  const [ticketCount, setTicketCount] = useState(2);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingShowtimes, setIsLoadingShowtimes] = useState(false);

  // Load movie data
  useEffect(() => {
    const loadMovie = async () => {
      if (!movieId) return;

      try {
        setIsLoading(true);
        const movieData = await movieService.getMovie(movieId);
        setMovie(movieData);
      } catch (err) {
        console.error('Failed to load movie:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMovie();
  }, [movieId]);

  // Load all showtimes for movie
  useEffect(() => {
    const loadShowtimes = async () => {
      if (!movieId) return;

      try {
        setIsLoadingShowtimes(true);
        const data = await showtimeService.getUpcomingShowtimesByMovie(movieId);
        console.log('Fetched showtimes:', data);

        setAllShowtimes(data);
      } catch (err) {
        console.error('Failed to load showtimes:', err);
      } finally {
        setIsLoadingShowtimes(false);
      }
    };

    loadShowtimes();
  }, [movieId]);

  // Group showtimes by date, then by cinema and room
  const groupedByDate = useMemo((): GroupedByDate[] => {
    const dateMap = new Map<string, GroupedByDate>();

    allShowtimes.forEach(showtime => {
      const showDate = new Date(showtime.start_time);
      const dateKey = showDate.toDateString();

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {
          date: showDate,
          dateStr: dateKey,
          cinemas: [],
        });
      }

      const dateGroup = dateMap.get(dateKey)!;
      const cinema = showtime.room?.cinema;
      if (!cinema) return;

      let cinemaGroup = dateGroup.cinemas.find(c => c.id === cinema.id);
      if (!cinemaGroup) {
        cinemaGroup = {
          id: cinema.id,
          name: cinema.name,
          city: cinema.city || '',
          rooms: [],
        };
        dateGroup.cinemas.push(cinemaGroup);
      }

      let roomGroup = cinemaGroup.rooms.find(r => r.id === showtime.room?.id);
      if (!roomGroup && showtime.room) {
        roomGroup = {
          id: showtime.room.id,
          name: showtime.room.name,
          showtimes: [],
        };
        cinemaGroup.rooms.push(roomGroup);
      }

      roomGroup?.showtimes.push(showtime);
    });

    // Sort by date, and showtimes by time
    const result = Array.from(dateMap.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );

    result.forEach(dateGroup => {
      dateGroup.cinemas.forEach(cinema => {
        cinema.rooms.forEach(room => {
          room.showtimes.sort((a, b) =>
            new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
          );
        });
      });
    });

    return result;
  }, [allShowtimes]);

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US').format(price) + ' VND';
  };

  const formatDateFull = (date: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    let prefix = days[date.getDay()];
    if (date.toDateString() === today.toDateString()) {
      prefix = 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      prefix = 'Tomorrow';
    }

    return `${prefix}, ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const handleSelectShowtime = (showtime: Showtime) => {
    setSelectedShowtime(showtime);
  };

  const handleProceedToSeats = () => {
    if (!selectedShowtime) return;
    navigate(`/booking/seats/${selectedShowtime.id}?tickets=${ticketCount}`);
  };

  const totalPrice = selectedShowtime ? selectedShowtime.price * ticketCount : 0;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-amber-500" size={48} />
        </div>
      </MainLayout>
    );
  }

  if (!movie) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center text-white">
          Movie not found
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen relative text-white">
        {/* Fixed Background Image */}
        <div
          className="fixed inset-0 w-full h-full z-0"
          style={{
            backgroundImage: `url(${movie.background_url || movie.poster_url || ''})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/60" />
          <div className="absolute inset-0 bg-black/50" />
        </div>

        {/* Content */}
        <div className="relative z-10 py-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Movie Info & Showtimes */}
              <div className="lg:col-span-2 space-y-6">
                {/* Movie Info */}
                <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <div className="flex gap-6">
                    {movie.poster_url && (
                      <img
                        src={movie.poster_url}
                        alt={movie.title}
                        className="w-32 h-48 object-cover rounded-lg shadow-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h1 className="text-2xl font-bold text-white">{movie.title}</h1>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                        <span>{movie.release_date?.split('-')[0]}</span>
                        <span>•</span>
                        <span>{movie.genre}</span>
                        <span>•</span>
                        <span>{movie.duration_minutes} min</span>
                      </div>
                      {movie.imdb_rating && (
                        <div className="flex items-center gap-1 mt-2">
                          <Star className="text-yellow-500 fill-yellow-500" size={16} />
                          <span className="text-white font-medium">{movie.imdb_rating}</span>
                        </div>
                      )}
                      <p className="mt-4 text-gray-400 text-sm line-clamp-3">
                        {movie.synopsis}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Showtimes by Date */}
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Calendar size={24} className="text-amber-500" />
                    Showtimes
                  </h2>

                  {isLoadingShowtimes ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="animate-spin text-amber-500" size={32} />
                    </div>
                  ) : groupedByDate.length === 0 ? (
                    <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center">
                      <Calendar size={48} className="mx-auto mb-4 text-gray-500" />
                      <p className="text-gray-400">No showtimes available for this movie</p>
                    </div>
                  ) : (
                    groupedByDate.map((dateGroup) => (
                      <div
                        key={dateGroup.dateStr}
                        className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden"
                      >
                        {/* Date Header */}
                        <div className="bg-amber-500/20 border-b border-amber-500/30 px-5 py-3">
                          <h3 className="text-amber-400 font-semibold">
                            {formatDateFull(dateGroup.date)}
                          </h3>
                        </div>

                        {/* Cinemas for this date */}
                        <div className="p-4 space-y-4">
                          {dateGroup.cinemas.map((cinema) => (
                            <div
                              key={cinema.id}
                              className="bg-white/5 rounded-lg p-4"
                            >
                              <div className="flex items-start gap-3 mb-3">
                                <MapPin size={18} className="text-amber-400 mt-0.5 flex-shrink-0" />
                                <div>
                                  <h4 className="text-white font-semibold">{cinema.name}</h4>
                                  <p className="text-gray-500 text-sm">{cinema.city}</p>
                                </div>
                              </div>

                              {cinema.rooms.map((room) => (
                                <div key={room.id} className="mb-3 last:mb-0 ml-7">
                                  <p className="text-gray-400 text-sm mb-2">{room.name}</p>
                                  <div className="flex flex-wrap gap-2">
                                    {room.showtimes.map((showtime) => {
                                      const isSelected = selectedShowtime?.id === showtime.id;
                                      const now = new Date();
                                      const startTime = new Date(showtime.start_time);
                                      // Keep selling until 10 minutes AFTER showtime starts
                                      const SALE_WINDOW_AFTER_MIN = 10; // allow sales until 10 minutes after start
                                      const msSinceStart = now.getTime() - startTime.getTime();
                                      const msUntilEndOfWindow = startTime.getTime() + SALE_WINDOW_AFTER_MIN * 60 * 1000 - now.getTime();
                                      const isSalesClosed = msUntilEndOfWindow < 0; // closed if now is later than start + window
                                      const cutoffTime = new Date(startTime.getTime() + SALE_WINDOW_AFTER_MIN * 60 * 1000);

                                      const handleShowtimeClick = () => {
                                        if (isSalesClosed) {
                                          alert(`Ticket sales closed. Sales close ${SALE_WINDOW_AFTER_MIN} minutes after showtime starts, at ${cutoffTime.toLocaleTimeString('en-US')} on ${cutoffTime.toLocaleDateString('en-US')}`);
                                          return;
                                        }
                                        handleSelectShowtime(showtime);
                                      };

                                      return (
                                        <button
                                          key={showtime.id}
                                          onClick={handleShowtimeClick}
                                          disabled={isSalesClosed}
                                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${isSalesClosed
                                              ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                              : isSelected
                                                ? 'bg-amber-500 text-black ring-2 ring-amber-300'
                                                : 'bg-gray-800 text-white hover:bg-gray-700'
                                            }`}
                                        >
                                          <span className="font-bold">{formatTime(showtime.start_time)}</span>
                                          <span className="text-xs ml-2 opacity-75">
                                            {formatPrice(showtime.price)}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Column - Selection Summary */}
              <div className="lg:col-span-1">
                <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-6 sticky top-24">
                  <h2 className="text-lg font-semibold text-white mb-4 uppercase tracking-wide">
                    Booking Information
                  </h2>

                  {selectedShowtime ? (
                    <>
                      <div className="flex gap-4 mb-6">
                        {movie.poster_url && (
                          <img
                            src={movie.poster_url}
                            alt={movie.title}
                            className="w-20 h-28 object-cover rounded-lg"
                          />
                        )}
                        <div>
                          <p className="text-xs text-gray-500">Movie</p>
                          <p className="text-white font-medium">{movie.title}</p>
                        </div>
                      </div>

                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Cinema</span>
                          <span className="text-white text-right">{selectedShowtime.room?.cinema?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Date</span>
                          <span className="text-white">
                            {new Date(selectedShowtime.start_time).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Time</span>
                          <span className="text-white">{formatTime(selectedShowtime.start_time)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Room</span>
                          <span className="text-white">{selectedShowtime.room?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Ticket Price</span>
                          <span className="text-white">{formatPrice(selectedShowtime.price)} / ticket</span>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-gray-400">Number of Tickets</span>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                              className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="text-white font-medium w-8 text-center">{ticketCount}</span>
                            <button
                              onClick={() => setTicketCount(Math.min(10, ticketCount + 1))}
                              className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-between items-center mb-6">
                          <span className="text-gray-400">Total</span>
                          <span className="text-2xl font-bold text-amber-400">{formatPrice(totalPrice)}</span>
                        </div>

                        <button
                          onClick={handleProceedToSeats}
                          className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg transition-colors"
                        >
                          SELECT SEATS
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <Clock size={32} className="mx-auto mb-2 opacity-50" />
                      <p>Select a showtime to continue</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
