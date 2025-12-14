import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { MainLayout } from '../components/layouts';
import { showtimeService, type Showtime } from '../services/showtimeService';
import { bookingService, type SeatUpdateEvent, type LockedSeat, unlockSeats } from '../services/bookingService';
import { useAuth } from '../contexts/AuthContext';
import type { Seat, SeatWithStatus as BaseSeatWithStatus } from '../types/cinema';

interface SeatWithStatus extends Seat {
  status: 'available' | 'booked' | 'locked' | 'selected' | 'locked_by_me';
  locked_by?: string;
}

export default function SeatSelectionPage() {
  const { showtimeId } = useParams<{ showtimeId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Generate a unique user ID for this session if not logged in
  const userId = user?.id || `guest_${sessionStorage.getItem('guestId') || (() => {
    const id = Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('guestId', id);
    return id;
  })()}`;
  
  // Data states
  const [showtime, setShowtime] = useState<Showtime | null>(null);
  const [baseSeats, setBaseSeats] = useState<BaseSeatWithStatus[]>([]); // Original seats from API with status
  const [seats, setSeats] = useState<SeatWithStatus[]>([]); // Seats with status
  const [selectedSeats, setSelectedSeats] = useState<SeatWithStatus[]>([]);
  const [lockedSeats, setLockedSeats] = useState<Map<string, LockedSeat>>(new Map());
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);

  // Check if user returned from payment page without completing payment
  useEffect(() => {
    // Check if user came from payment page
    const referrer = document.referrer;
    const isFromPayment = referrer.includes('/booking/payment') || referrer.includes('payment');
    const storedSeats = sessionStorage.getItem(`selectedSeats_${showtimeId}`);
    
    if ((isFromPayment || storedSeats) && showtimeId) {
      // User returned from payment page - unlock any seats that were stored
      if (storedSeats) {
        try {
          const seatIds = JSON.parse(storedSeats);
          if (seatIds.length > 0) {
            console.log('Unlocking seats from previous session:', seatIds);
            unlockSeats(showtimeId, seatIds).catch(console.error);
          }
        } catch (error) {
          console.error('Error parsing stored seats:', error);
        }
        // Clear the stored seats
        sessionStorage.removeItem(`selectedSeats_${showtimeId}`);
      }
    }
  }, [showtimeId]);

  // Handle socket events
  useEffect(() => {
    if (!showtimeId) return;

    let socketInstance: Awaited<ReturnType<typeof bookingService.connectSocket>> | null = null;

    // Connect to socket (async)
    const initSocket = async () => {
      socketInstance = await bookingService.connectSocket();
      
      socketInstance.on('connect', () => {
        console.log('🔌 Socket connected');
        bookingService.joinShowtimeRoom(showtimeId);
      });

      socketInstance.on('disconnect', () => {
        console.log('🔌 Socket disconnected');
      });

      // Listen for initial seat status when joining room
      bookingService.onSeatStatus((data) => {
        console.log('📥 Received seat_status:', data);
        const newLockedSeats = new Map<string, LockedSeat>();
        data.locked_seats.forEach(seat => {
          newLockedSeats.set(seat.seat_id, seat);
        });
        setLockedSeats(newLockedSeats);
      });

      // Listen for seat updates
      bookingService.onSeatUpdate((data: SeatUpdateEvent) => {
        console.log('📥 Received seat_update:', data);
        
        setLockedSeats(prev => {
          const newMap = new Map(prev);
          
          switch (data.event) {
            case 'seat_locked':
              // Add seat to locked list
              newMap.set(data.seat_id, {
                seat_id: data.seat_id,
                user_id: data.user_id || '',
                ttl: 0,
              });
              // If seat is locked by someone else, remove from my selection
              if (data.user_id !== userId) {
                setSelectedSeats(prev => prev.filter(s => s.id !== data.seat_id));
              }
              break;
            case 'seat_expired':
              // Only process when seat expires (don't process manual unlock)
              newMap.delete(data.seat_id);
              // If my seat expires, remove from selection
              if (data.user_id === userId) {
                setSelectedSeats(prev => prev.filter(s => s.id !== data.seat_id));
              }
              break;
            case 'seat_unlocked':
              // Don't process manual unlock as requested
              // But still update status to keep UI in sync
              newMap.delete(data.seat_id);
              break;
          }
          
          return newMap;
        });
      });

      // Listen for seats_booked event (when someone confirms payment)
      bookingService.onSeatsBooked((data) => {
        console.log('📥 Received seats_booked:', data);
        // Mark these seats as booked in baseSeats
        setBaseSeats(prev => prev.map(seat => {
          if (data.seat_ids.includes(seat.id)) {
            return { ...seat, status: 'booked' as const };
          }
          return seat;
        }));
        // Remove from locked seats map
        setLockedSeats(prev => {
          const newMap = new Map(prev);
          data.seat_ids.forEach(seatId => newMap.delete(seatId));
          return newMap;
        });
        // Remove from selection if user was selecting these seats
        setSelectedSeats(prev => prev.filter(s => !data.seat_ids.includes(s.id)));
      });
    };

    initSocket();

    // Cleanup on unmount
    return () => {
      bookingService.leaveShowtimeRoom(showtimeId);
      bookingService.offSeatStatus();
      bookingService.offSeatUpdate();
      bookingService.offBookingEvents();
      bookingService.disconnectSocket();
    };
  }, [showtimeId, userId]);

  // Update seats when lockedSeats changes
  useEffect(() => {
    if (baseSeats.length > 0) {
      const seatsWithStatus: SeatWithStatus[] = baseSeats.map(seat => {
        // If seat is already booked from API, keep original state
        if (seat.status === 'booked') {
          return {
            ...seat,
            status: 'booked',
          } as SeatWithStatus;
        }
        
        // Check if seat is currently locked
        const lockInfo = lockedSeats.get(seat.id);
        if (lockInfo) {
          const isMyLock = lockInfo.user_id === userId;
          return {
            ...seat,
            status: isMyLock ? 'locked_by_me' : 'locked',
            locked_by: lockInfo.user_id,
          } as SeatWithStatus;
        }
        
        return {
          ...seat,
          status: 'available',
        } as SeatWithStatus;
      });
      setSeats(seatsWithStatus);
    }
  }, [lockedSeats, baseSeats, userId]);

  // Load showtime and seats data
  useEffect(() => {
    const loadData = async () => {
      if (!showtimeId) return;
      
      try {
        setIsLoading(true);
        
        // Load showtime
        const showtimeData = await showtimeService.getShowtime(showtimeId);
        setShowtime(showtimeData);
        
        // Load seats with status (available/booked) from API
        const seatsData = await showtimeService.getShowtimeSeats(showtimeId);
        
        // Save base seats
        setBaseSeats(seatsData);
        
        // Initialize seats - status from API already has available/booked
        const seatsWithStatus: SeatWithStatus[] = seatsData.map(seat => ({
          ...seat,
          status: seat.status as 'available' | 'booked',
        }));
        
        setSeats(seatsWithStatus);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [showtimeId]);

  // Group seats by row
  const seatsByRow = useMemo(() => {
    const grouped = new Map<string, SeatWithStatus[]>();
    
    seats.forEach(seat => {
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
  }, [seats]);

  // Find the paired couple seat (1-2, 3-4, 5-6, etc.)
  const findCouplePair = (seat: SeatWithStatus): SeatWithStatus | null => {
    if (seat.seat_type !== 'COUPLE') return null;
    
    const rowSeats = seats.filter(s => s.row === seat.row && s.seat_type === 'COUPLE');
    // Couple seats are paired: 1-2, 3-4, 5-6, etc.
    const isOddNumber = seat.number % 2 === 1;
    const pairNumber = isOddNumber ? seat.number + 1 : seat.number - 1;
    
    return rowSeats.find(s => s.number === pairNumber) || null;
  };

  const handleSeatClick = (seat: SeatWithStatus) => {
    if (!showtimeId) return;
    if (seat.status === 'booked' || seat.status === 'locked' || !seat.is_active) return;
    
    const isSelected = selectedSeats.some(s => s.id === seat.id);
    
    // For couple seats, handle both seats together
    if (seat.seat_type === 'COUPLE') {
      const pairSeat = findCouplePair(seat);
      
      if (isSelected) {
        // Deselect both couple seats
        const idsToRemove = new Set([seat.id, pairSeat?.id]);
        setSelectedSeats(prev => prev.filter(s => !idsToRemove.has(s.id)));
      } else {
        // Check if pair seat is available
        if (pairSeat && (pairSeat.status === 'booked' || pairSeat.status === 'locked' || !pairSeat.is_active)) {
          return;
        }
        
        // Select both couple seats - no limit
        const seatsToAdd = pairSeat ? [seat, pairSeat].sort((a, b) => a.number - b.number) : [seat];
        setSelectedSeats(prev => [...prev, ...seatsToAdd]);
      }
    } else {
      // Regular seat selection logic - no limit
      if (isSelected) {
        setSelectedSeats(prev => prev.filter(s => s.id !== seat.id));
      } else {
        setSelectedSeats(prev => [...prev, seat]);
      }
    }
  };

  const getSeatColor = (seat: SeatWithStatus) => {
    const isSelected = selectedSeats.some(s => s.id === seat.id);
    
    if (!seat.is_active) return 'bg-transparent border-transparent cursor-not-allowed';
    if (seat.status === 'booked') return 'bg-gray-600 border-gray-600 cursor-not-allowed';
    if (seat.status === 'locked') return 'bg-orange-500/50 border-orange-500 cursor-not-allowed';
    if (seat.status === 'locked_by_me' || isSelected) return 'bg-green-500 border-green-500 cursor-pointer';
    
    switch (seat.seat_type) {
      case 'VIP':
        return 'bg-purple-600/30 border-purple-500 hover:bg-purple-500 cursor-pointer';
      case 'COUPLE':
        return 'bg-pink-600/30 border-pink-500 hover:bg-pink-500 cursor-pointer';
      default:
        return 'bg-blue-600/30 border-blue-500 hover:bg-blue-500 cursor-pointer';
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Calculate prices
  const calculateSeatPrice = (seat: SeatWithStatus) => {
    const basePrice = showtime?.price || 0;
    switch (seat.seat_type) {
      case 'VIP':
        return basePrice * 1.25; // VIP is 1.25 times more expensive
      case 'COUPLE':
        return basePrice; // Couple seats keep original price (sold in pairs)
      default:
        return basePrice;
    }
  };

  const totalPrice = selectedSeats.reduce((sum, seat) => sum + calculateSeatPrice(seat), 0);
  const standardCount = selectedSeats.filter(s => s.seat_type === 'STANDARD').length;
  const vipCount = selectedSeats.filter(s => s.seat_type === 'VIP').length;
  const coupleCount = selectedSeats.filter(s => s.seat_type === 'COUPLE').length;

  const [isLocking, setIsLocking] = useState(false);

  const handleProceedToPayment = async () => {
    if (selectedSeats.length === 0 || !showtimeId || !showtime) return;
    
    setIsLocking(true);
    try {
      // Lock all selected seats when proceeding to payment
      const seatIds = selectedSeats.map(s => s.id);
      const result = await bookingService.lockSeats(showtimeId, seatIds);
      
      if (result.success) {
        // Prepare seat data with prices for payment page
        const seatsWithPrices = selectedSeats.map(seat => ({
          id: seat.id,
          row: seat.row,
          number: seat.number,
          seat_type: seat.seat_type,
          price: calculateSeatPrice(seat),
        }));

        // Navigate to payment page with state
        navigate('/booking/payment', {
          state: {
            showtime,
            selectedSeats: seatsWithPrices,
            totalPrice,
          }
        });
        
        // Store selected seats in sessionStorage as backup for unlock on return
        sessionStorage.setItem(`selectedSeats_${showtimeId}`, JSON.stringify(seatIds));
      } else {
        alert(result.message || 'Some seats have been selected by others. Please choose different seats.');
        // Remove failed seats from selection
        if (result.failed_seats && result.failed_seats.length > 0) {
          const failedIds = new Set(result.failed_seats.map(f => f.seat_id));
          setSelectedSeats(prev => prev.filter(s => !failedIds.has(s.id)));
        }
      }
    } catch (error) {
      console.error('Error locking seats:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsLocking(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-amber-500" size={48} />
        </div>
      </MainLayout>
    );
  }

  if (!showtime) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center text-white">
          Showtime not found
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
            backgroundImage: `url(${showtime.movie?.poster_url || ''})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/60" />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Content */}
        <div className="relative z-10 py-8">
          <div className="max-w-7xl mx-auto px-4">
            {/* Connection Status */}
            {/* <div className="flex items-center justify-end mb-4">
              <div className={`flex items-center gap-2 text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                {isConnected ? 'Connected' : 'Connecting...'}
              </div>
            </div> */}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Seat Map */}
              <div className="lg:col-span-2">
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
                        const isSelected = selectedSeats.some(s => s.id === seat.id);
                        
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
                              <button
                                key={seat.id}
                                onClick={() => handleSeatClick(seat)}
                                disabled={seat.status === 'booked' || seat.status === 'locked' || !seat.is_active}
                                className={`w-6 h-6 rounded-t-lg border-2 text-[10px] font-medium transition-all ${getSeatColor(seat)}`}
                                title={`${row}${seat.number} - ${seat.seat_type}${seat.status === 'locked' ? ' (Locked)' : seat.status === 'booked' ? ' (Booked)' : ''}`}
                              >
                                {seat.is_active && (
                                  <span className={isSelected ? 'text-white' : 'text-gray-300'}>
                                    {seat.number}
                                  </span>
                                )}
                              </button>
                            );
                          }
                          
                          // Both seats in the pair exist - render as merged
                          const isPairSelected = selectedSeats.some(s => s.id === seat1.id) || selectedSeats.some(s => s.id === seat2.id);
                          const isPairLocked = seat1.status === 'locked' || seat2.status === 'locked';
                          const isPairBooked = seat1.status === 'booked' || seat2.status === 'booked' || !seat1.is_active || !seat2.is_active;
                          
                          return (
                            <button
                              key={`couple-${seat1.id}-${seat2.id}`}
                              onClick={() => handleSeatClick(seat1)}
                              disabled={isPairBooked || isPairLocked}
                              className={`w-14 h-6 rounded-t-lg border-2 text-[10px] font-medium transition-all flex items-center justify-center gap-0.5 ${
                                isPairBooked
                                  ? 'bg-gray-600 border-gray-600 cursor-not-allowed'
                                  : isPairLocked
                                  ? 'bg-orange-500/50 border-orange-500 cursor-not-allowed'
                                  : isPairSelected
                                  ? 'bg-green-500 border-green-500 cursor-pointer'
                                  : 'bg-pink-600/30 border-pink-500 hover:bg-pink-500 cursor-pointer'
                              }`}
                              title={`${row}${seat1.number}-${seat2.number} - Couple Seat${isPairLocked ? ' (Locked)' : isPairBooked ? ' (Booked)' : ''}`}
                            >
                              <span className={isPairSelected ? 'text-white' : 'text-gray-300'}>
                                {seat1.number}
                              </span>
                              <span className={isPairSelected ? 'text-white' : 'text-gray-300'}>
                                {seat2.number}
                              </span>
                            </button>
                          );
                        }
                        
                        // Regular seat rendering
                        return (
                          <button
                            key={seat.id}
                            onClick={() => handleSeatClick(seat)}
                            disabled={seat.status === 'booked' || seat.status === 'locked' || !seat.is_active}
                            className={`w-6 h-6 rounded-t-lg border-2 text-[10px] font-medium transition-all ${getSeatColor(seat)}`}
                            title={`${row}${seat.number} - ${seat.seat_type}${seat.status === 'locked' ? ' (Locked)' : seat.status === 'booked' ? ' (Booked)' : ''}`}
                          >
                            {seat.is_active && (
                              <span className={isSelected ? 'text-white' : 'text-gray-300'}>
                                {seat.number}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <span className="w-6 text-gray-400 text-sm font-medium">{row}</span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 text-sm">
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
                <div className="w-6 h-6 rounded-t-lg bg-orange-500/50 border-2 border-orange-500"></div>
                <span className="text-gray-400">Locked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-t-lg bg-gray-600 border-2 border-gray-600"></div>
                <span className="text-gray-400">Booked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-t-lg bg-green-500 border-2 border-green-500"></div>
                <span className="text-gray-400">Selected</span>
              </div>
            </div>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <div className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-xl p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-white mb-4">Booking Information</h2>
              
              {/* Movie Info */}
              <div className="flex gap-4 mb-6">
                {showtime.movie?.poster_url && (
                  <img
                    src={showtime.movie.poster_url}
                    alt={showtime.movie.title}
                    className="w-20 h-28 object-cover rounded-lg"
                  />
                )}
                <div>
                  <h3 className="text-white font-semibold">{showtime.movie?.title}</h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {formatDate(showtime.start_time)}, {formatTime(showtime.start_time)}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {showtime.room?.cinema?.name}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {showtime.room?.name}
                  </p>
                </div>
              </div>

              {/* Selected Seats */}
              {selectedSeats.length > 0 && (
                <div className="mb-6">
                  <p className="text-gray-400 text-sm mb-2">
                    {selectedSeats.length} Seats:{' '}
                    <span className="text-white">
                      {selectedSeats.map(s => `${s.row}${s.number}`).join(', ')}
                    </span>
                  </p>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="space-y-2 text-sm border-t border-white/10 pt-4">
                {standardCount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Standard Seat × {standardCount}</span>
                    <span className="text-white">
                      {formatPrice(standardCount * (showtime.price || 0))}
                    </span>
                  </div>
                )}
                {vipCount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">VIP Seat × {vipCount}</span>
                    <span className="text-white">
                      {formatPrice(vipCount * (showtime.price || 0) * 1.25)}
                    </span>
                  </div>
                )}
                {coupleCount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Couple Seat × {coupleCount}</span>
                    <span className="text-white">
                      {formatPrice(coupleCount * (showtime.price || 0))}
                    </span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
                <span className="text-gray-400">Total Amount</span>
                <span className="text-2xl font-bold text-amber-400">{formatPrice(totalPrice)}</span>
              </div>

              {/* Proceed Button */}
              <button
                onClick={handleProceedToPayment}
                disabled={selectedSeats.length === 0 || isLocking}
                className="w-full mt-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isLocking ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    PROCESSING...
                  </>
                ) : (
                  'CONTINUE TO PAYMENT'
                )}
              </button>
            </div>
          </div>
        </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
