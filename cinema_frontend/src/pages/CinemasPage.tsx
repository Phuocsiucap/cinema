import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Users,
  ChevronRight,
  Search,
  Star,
  X,
  Clock,
  Calendar,
  Film,
  Ticket,
  Armchair
} from 'lucide-react';
import { MainLayout } from '../components/layouts';
import { cinemaService, showtimeService } from '../services';
import type { Cinema, CinemaRoom, Seat } from '../types/cinema';
import type { Showtime } from '../services/showtimeService';

interface CinemaWithDetails extends Cinema {
  rating?: number;
  totalSeats?: number;
}

// Group showtimes by date and movie
interface GroupedShowtimes {
  [date: string]: {
    [movieId: string]: {
      movie: Showtime['movie'];
      showtimes: Showtime[];
    };
  };
}

export function CinemasPage() {
  const navigate = useNavigate();
  const [cinemas, setCinemas] = useState<CinemaWithDetails[]>([]);
  const [filteredCinemas, setFilteredCinemas] = useState<CinemaWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [cities, setCities] = useState<string[]>([]);

  // Showtimes modal state
  const [selectedCinema, setSelectedCinema] = useState<CinemaWithDetails | null>(null);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [isLoadingShowtimes, setIsLoadingShowtimes] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Room seat modal state
  const [selectedRoom, setSelectedRoom] = useState<CinemaRoom | null>(null);
  const [roomModalCinema, setRoomModalCinema] = useState<CinemaWithDetails | null>(null);

  useEffect(() => {
    loadCinemas();
  }, []);

  useEffect(() => {
    filterCinemas();
  }, [searchQuery, selectedCity, cinemas]);

  const loadCinemas = async () => {
    setIsLoading(true);
    try {
      const data = await cinemaService.getCinemas();
      
      // Transform data
      const transformedCinemas: CinemaWithDetails[] = data.map((cinema: Cinema) => ({
        ...cinema,
        rating: Math.random() * 1 + 4, // Random rating 4-5
        totalSeats: cinema.rooms?.reduce((sum: number, room: CinemaRoom) => sum + (room.seat_count || 0), 0) || 0,
      }));
      
      setCinemas(transformedCinemas);

      // Extract unique cities
      const uniqueCities = [...new Set(transformedCinemas.map((c: CinemaWithDetails) => c.city))].sort();
      setCities(uniqueCities as string[]);
    } catch (err) {
      console.error('Failed to load cinemas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterCinemas = () => {
    let filtered = cinemas;

    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.city.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCity) {
      filtered = filtered.filter(c => c.city === selectedCity);
    }

    setFilteredCinemas(filtered);
  };

  // Load showtimes for a cinema
  const handleViewShowtimes = async (cinema: CinemaWithDetails) => {
    setSelectedCinema(cinema);
    setIsLoadingShowtimes(true);
    try {
      const data = await showtimeService.getUpcomingShowtimesByCinema(cinema.id);
      setShowtimes(data);
      
      // Set default selected date to today if available, otherwise first available date
      const today = new Date().toISOString().split('T')[0];
      const availableDates = getAvailableDates(data);
      if (availableDates.includes(today)) {
        setSelectedDate(today);
      } else if (availableDates.length > 0) {
        setSelectedDate(availableDates[0]);
      } else {
        setSelectedDate(''); // No available dates
      }
    } catch (err) {
      console.error('Failed to load showtimes:', err);
    } finally {
      setIsLoadingShowtimes(false);
    }
  };

  const closeModal = () => {
    setSelectedCinema(null);
    setShowtimes([]);
    setSelectedDate('');
  };

  // Handle view room seats
  const handleViewRoom = (cinema: CinemaWithDetails, room: CinemaRoom) => {
    setRoomModalCinema(cinema);
    setSelectedRoom(room);
  };

  const closeRoomModal = () => {
    setSelectedRoom(null);
    setRoomModalCinema(null);
  };

  // Group seats by row for room modal
  const seatsByRow = useMemo(() => {
    if (!selectedRoom?.seats) return [];
    
    const grouped = new Map<string, Seat[]>();
    
    selectedRoom.seats.forEach(seat => {
      if (!grouped.has(seat.row)) {
        grouped.set(seat.row, []);
      }
      grouped.get(seat.row)!.push(seat);
    });
    
    // Sort seats within each row by number
    grouped.forEach(rowSeats => {
      rowSeats.sort((a, b) => a.number - b.number);
    });
    
    // Convert to array and sort by row
    return Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [selectedRoom]);

  // Get seat color based on type
  const getSeatColor = (seat: Seat) => {
    if (!seat.is_active) return 'bg-transparent border-transparent';
    
    switch (seat.seat_type) {
      case 'VIP':
        return 'bg-purple-600/30 border-purple-500';
      case 'COUPLE':
        return 'bg-pink-600/30 border-pink-500';
      default:
        return 'bg-blue-600/30 border-blue-500';
    }
  };

  // Get unique dates from showtimes (from today onwards)
  const getAvailableDates = (showtimeList: Showtime[]): string[] => {
    const dates = showtimeList
      .map(st => new Date(st.start_time).toISOString().split('T')[0]); // API already filters for future showtimes
    return [...new Set(dates)].sort();
  };

  // Group showtimes by movie for selected date
  const getShowtimesByMovie = (): GroupedShowtimes[string] => {
    const filtered = showtimes.filter(st => {
      const stDate = new Date(st.start_time).toISOString().split('T')[0];
      return stDate === selectedDate; // API already filters for future showtimes
    });

    const grouped: GroupedShowtimes[string] = {};
    filtered.forEach(st => {
      if (!st.movie) return;
      if (!grouped[st.movie.id]) {
        grouped[st.movie.id] = {
          movie: st.movie,
          showtimes: [],
        };
      }
      grouped[st.movie.id].showtimes.push(st);
    });

    // Sort showtimes by start_time
    Object.values(grouped).forEach(g => {
      g.showtimes.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    });

    return grouped;
  };

  // Format time
  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format date for display
  const formatDateDisplay = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    });
  };

  // Format price
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  return (
    <MainLayout>
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white">Cinemas</h1>
              <p className="text-gray-400 mt-2">Find cinemas near you</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative sm:col-span-2">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cinemas..."
                className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* City Filter */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">City</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">All Cities</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
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
                  setSelectedCity('');
                }}
                className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Cinemas List */}
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
            </div>
          ) : filteredCinemas.length === 0 ? (
            <div className="text-center py-20">
              <MapPin size={48} className="mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 text-lg">No cinemas found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCinemas.map((cinema) => (
                <div
                  key={cinema.id}
                  className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-red-500/50 transition-colors"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Info */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-2">{cinema.name}</h3>
                        <div className="flex items-center gap-2 text-gray-400 mb-4">
                          <MapPin size={18} />
                          <span>{cinema.city}</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-red-400">{cinema.total_rooms}</div>
                          <div className="text-sm text-gray-400">Room</div>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-blue-400">{cinema.totalSeats}</div>
                          <div className="text-sm text-gray-400">Seats</div>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Star size={16} className="text-yellow-400" fill="currentColor" />
                            <span className="text-xl font-bold text-yellow-400">{cinema.rating?.toFixed(1)}</span>
                          </div>
                          <div className="text-sm text-gray-400">Rating</div>
                        </div>
                      </div>

                      {/* Address */}
                      <div className="text-sm text-gray-400">
                        <p>{cinema.address}</p>
                      </div>
                    </div>

                    {/* Rooms List */}
                    <div>
                      <h4 className="text-white font-semibold mb-3">Rooms</h4>
                      <div className="space-y-2">
                        {cinema.rooms && cinema.rooms.length > 0 ? (
                          cinema.rooms.slice(0, 5).map((room: CinemaRoom) => (
                            <div
                              key={room.id}
                              onClick={() => handleViewRoom(cinema, room)}
                              className="flex items-center justify-between bg-gray-800/30 rounded-lg p-3 hover:bg-gray-800/50 transition-colors cursor-pointer group"
                            >
                              <div>
                                <p className="text-white font-medium group-hover:text-red-400 transition-colors">{room.name}</p>
                                <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                                  <Users size={12} />
                                  <span>{room.seats?.length || 0} seats</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Armchair size={16} className="text-gray-500 group-hover:text-red-400 transition-colors" />
                                <ChevronRight size={18} className="text-gray-500 group-hover:text-red-400 transition-colors" />
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-400 text-sm">No rooms available</p>
                        )}
                        {cinema.rooms && cinema.rooms.length > 5 && (
                          <button className="w-full text-center text-red-400 hover:text-red-300 text-sm font-medium py-2 transition-colors">
                            View more ({cinema.rooms.length - 5} rooms)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-4 pt-4 border-t border-gray-800">
                    <button 
                      onClick={() => handleViewShowtimes(cinema)}
                      className="w-full sm:w-auto px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      View Showtimes
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Showtimes Modal */}
      {selectedCinema && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-800">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedCinema.name}</h2>
                <div className="flex items-center gap-2 text-gray-400 mt-1">
                  <MapPin size={16} />
                  <span>{selectedCinema.city}</span>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Date Selector */}
            <div className="p-4 border-b border-gray-800 overflow-x-auto">
              <div className="flex gap-2">
                {getAvailableDates(showtimes).map((date) => (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedDate === date
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      <span>{formatDateDisplay(date)}</span>
                    </div>
                  </button>
                ))}
                {getAvailableDates(showtimes).length === 0 && !isLoadingShowtimes && (
                  <p className="text-gray-400">No showtimes available</p>
                )}
              </div>
            </div>

            {/* Showtimes Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {isLoadingShowtimes ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-red-500"></div>
                </div>
              ) : Object.keys(getShowtimesByMovie()).length === 0 ? (
                <div className="text-center py-12">
                  <Film size={48} className="mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400">No showtimes available for this date</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.values(getShowtimesByMovie()).map(({ movie, showtimes: movieShowtimes }) => (
                    <div key={movie?.id} className="bg-gray-800/50 rounded-xl p-4">
                      {/* Movie Info */}
                      <div className="flex gap-4 mb-4">
                        {movie?.poster_url ? (
                          <img
                            src={movie.poster_url}
                            alt={movie.title}
                            className="w-20 h-28 object-cover rounded-lg flex-shrink-0"
                          />
                        ) : (
                          <div className="w-20 h-28 bg-gray-700 rounded-lg flex-shrink-0 flex items-center justify-center">
                            <Film size={24} className="text-gray-500" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-xl font-bold text-white">{movie?.title}</h3>
                          <div className="flex items-center gap-3 text-sm text-gray-400 mt-2">
                            <div className="flex items-center gap-1">
                              <Clock size={14} />
                              <span>{movie?.duration_minutes} min</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Timeline Showtimes */}
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                        {movieShowtimes.map((showtime) => {
                          const isPast = new Date(showtime.start_time) < new Date();
                          
                          const handleShowtimeClick = () => {
                            if (isPast) {
                              alert(`This showtime has already started at ${formatTime(showtime.start_time)}. Please select a future showtime.`);
                              return;
                            }
                            navigate(`/booking/seats/${showtime.id}`);
                          };
                          
                          return (
                            <button
                              key={showtime.id}
                              onClick={handleShowtimeClick}
                              disabled={isPast}
                              className={`group relative rounded-lg p-3 transition-all text-center ${
                                isPast
                                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed opacity-50'
                                  : 'bg-gray-700 hover:bg-red-600'
                              }`}
                            >
                              <div className={`text-lg font-bold ${isPast ? 'text-gray-600' : 'text-white'}`}>
                                {formatTime(showtime.start_time)}
                              </div>
                              <div className={`text-xs mt-1 ${isPast ? 'text-gray-600' : 'text-gray-400 group-hover:text-gray-200'}`}>
                                {showtime.room?.name}
                              </div>
                              <div className={`text-xs mt-1 font-medium ${isPast ? 'text-gray-600' : 'text-red-400 group-hover:text-white'}`}>
                                {formatPrice(showtime.price)}
                              </div>
                              {/* Hover tooltip */}
                              {!isPast && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 rounded-lg text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg border border-gray-700">
                                  <div className="flex items-center gap-1">
                                    <Ticket size={12} />
                                    <span>Book Now</span>
                                  </div>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Room Seats Modal */}
      {selectedRoom && roomModalCinema && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-800">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedRoom.name}</h2>
                <div className="flex items-center gap-2 text-gray-400 mt-1">
                  <MapPin size={16} />
                  <span>{roomModalCinema.name} - {roomModalCinema.city}</span>
                </div>
              </div>
              <button
                onClick={closeRoomModal}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Room Info */}
            <div className="p-4 border-b border-gray-800 bg-gray-800/30">
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <Users size={16} className="text-blue-400" />
                  <span>Total seats: <strong className="text-white">{selectedRoom.seats?.length || 0}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Armchair size={16} className="text-purple-400" />
                  <span>VIP seats: <strong className="text-white">{selectedRoom.seats?.filter(s => s.seat_type === 'VIP').length || 0}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Armchair size={16} className="text-pink-400" />
                  <span>Couple seats: <strong className="text-white">{selectedRoom.seats?.filter(s => s.seat_type === 'COUPLE').length || 0}</strong></span>
                </div>
              </div>
            </div>

            {/* Seat Map */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Screen */}
              <div className="mb-8">
                <div className="relative">
                  <div className="h-2 bg-gradient-to-b from-white/50 to-transparent rounded-t-full mx-12"></div>
                  <div className="text-center text-gray-400 text-sm mt-2">SCREEN</div>
                </div>
              </div>

              {/* Seats Grid */}
              <div className="flex flex-col items-center gap-2 mb-8">
                {seatsByRow.map(([row, rowSeats]) => {
                  // Track which couple seats we've already rendered
                  const renderedCoupleSeats = new Set<number>();
                  
                  return (
                    <div key={row} className="flex items-center gap-1">
                      <span className="w-6 text-gray-400 text-sm font-medium">{row}</span>
                      <div className="flex gap-1">
                        {rowSeats.map((seat) => {
                          // Handle couple seats - render as a merged pair
                          if (seat.seat_type === 'COUPLE') {
                            // Skip if we already rendered this pair
                            const pairBase = seat.number % 2 === 1 ? seat.number : seat.number - 1;
                            if (renderedCoupleSeats.has(pairBase)) {
                              return null;
                            }
                            renderedCoupleSeats.add(pairBase);
                            
                            // Find both seats in the pair
                            const seat1 = rowSeats.find(s => s.number === pairBase && s.seat_type === 'COUPLE');
                            const seat2 = rowSeats.find(s => s.number === pairBase + 1 && s.seat_type === 'COUPLE');
                            
                            if (!seat1 || !seat2) {
                              // Single couple seat without pair - render normally
                              return (
                                <div
                                  key={seat.id}
                                  className={`w-6 h-6 rounded-t-lg border-2 text-[10px] font-medium flex items-center justify-center ${getSeatColor(seat)}`}
                                  title={`${row}${seat.number} - ${seat.seat_type}`}
                                >
                                  {seat.is_active && (
                                    <span className="text-gray-300">{seat.number}</span>
                                  )}
                                </div>
                              );
                            }
                            
                            // Both seats in the pair exist - render as merged
                            return (
                              <div
                                key={`couple-${seat1.id}-${seat2.id}`}
                                className="w-14 h-6 rounded-t-lg border-2 text-[10px] font-medium flex items-center justify-center gap-0.5 bg-pink-600/30 border-pink-500"
                                title={`${row}${seat1.number}-${seat2.number} - Couple Seat`}
                              >
                                <span className="text-gray-300">{seat1.number}</span>
                                <span className="text-gray-300">{seat2.number}</span>
                              </div>
                            );
                          }
                          
                          // Regular seat rendering
                          return (
                            <div
                              key={seat.id}
                              className={`w-6 h-6 rounded-t-lg border-2 text-[10px] font-medium flex items-center justify-center ${getSeatColor(seat)}`}
                              title={`${row}${seat.number} - ${seat.seat_type}`}
                            >
                              {seat.is_active && (
                                <span className="text-gray-300">{seat.number}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <span className="w-6 text-gray-400 text-sm font-medium">{row}</span>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-4 text-sm border-t border-gray-800 pt-6">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-t-lg bg-blue-600/30 border-2 border-blue-500"></div>
                  <span className="text-gray-400">Standard</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-t-lg bg-purple-600/30 border-2 border-purple-500"></div>
                  <span className="text-gray-400">VIP</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-6 rounded-t-lg bg-pink-600/30 border-2 border-pink-500"></div>
                  <span className="text-gray-400">Couple Seat</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-t-lg bg-transparent border-2 border-transparent"></div>
                  <span className="text-gray-400">Inactive</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-800 bg-gray-800/30">
              <button
                onClick={closeRoomModal}
                className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

export default CinemasPage;
