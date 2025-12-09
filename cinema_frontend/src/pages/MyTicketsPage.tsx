import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { QrCode, CreditCard, RefreshCw, History, Ticket, CheckCircle, X } from 'lucide-react';
import { MainLayout } from '../components/layouts';
import { useAuth } from '../contexts/AuthContext';
import { getUserBookings, type BookingDetail, type BookingTicket } from '../services/bookingService';

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED' | 'FAILED';
type FilterType = 'upcoming' | 'past' | 'all';

export default function MyTicketsPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [bookings, setBookings] = useState<BookingDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('upcoming');
  const [selectedTicket, setSelectedTicket] = useState<BookingDetail | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check for success state from PaymentPage
  useEffect(() => {
    const state = location.state as { success?: boolean; message?: string } | null;
    if (state?.success && state?.message) {
      setSuccessMessage(state.message);
      // Clear the state after showing
      window.history.replaceState({}, document.title);
      // Auto-hide after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  }, [location.state]);

  useEffect(() => {
    const loadBookings = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        // getUserBookings không cần userId - backend lấy từ JWT token
        const response = await getUserBookings();
        if (response.success && response.data) {
          setBookings(response.data);
        } else {
          // Fallback to empty
          setBookings([]);
        }
      } catch (err) {
        console.error('Failed to load bookings:', err);
        setBookings([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadBookings();
  }, [user]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
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

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return 'text-green-500';
      case 'PENDING':
        return 'text-yellow-400';
      case 'CANCELLED':
      case 'FAILED':
        return 'text-red-500';
      case 'REFUNDED':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusDotColor = (status: BookingStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-500';
      case 'PENDING':
        return 'bg-yellow-400';
      case 'CANCELLED':
      case 'FAILED':
        return 'bg-red-500';
      case 'REFUNDED':
        return 'bg-blue-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = (status: BookingStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return 'Paid';
      case 'PENDING':
        return 'Pending Payment';
      case 'CANCELLED':
        return 'Cancelled';
      case 'FAILED':
        return 'Payment Failed';
      case 'REFUNDED':
        return 'Refunded';
      default:
        return status;
    }
  };

  const isUpcoming = (booking: BookingDetail) => {
    return new Date(booking.showtime.start_time) > new Date();
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return isUpcoming(booking);
    if (filter === 'past') return !isUpcoming(booking);
    return true;
  });

  const getSeatLabels = (tickets: BookingTicket[]) => {
    return tickets
      .map(t => `${t.seat_row}${t.seat_number}`)
      .sort()
      .join(', ');
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <Ticket className="w-16 h-16 text-gray-500" />
          <h2 className="text-white text-xl font-bold">Please log in</h2>
          <p className="text-gray-400">You need to log in to view your tickets</p>
          <Link
            to="/login"
            className="mt-4 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Login
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <main className="flex flex-1 justify-center px-4 py-8 sm:px-6 md:px-8">
        <div className="flex w-full max-w-4xl flex-col gap-6">
          {/* Success Message */}
          {successMessage && (
            <div className="flex items-center justify-between bg-green-500/20 border border-green-500/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-green-400 font-medium">{successMessage}</span>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-green-500 hover:text-green-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-white text-4xl font-black leading-tight tracking-tight">
                My Tickets
              </h1>
              <p className="text-white/60 text-base font-normal leading-normal">
                View your upcoming tickets and booking history.
              </p>
            </div>
            
            {/* Filter Tabs */}
            <div className="flex h-10 items-center justify-center rounded-lg bg-white/10 p-1 sm:w-auto">
              <label className={`flex h-full cursor-pointer items-center justify-center rounded-md px-4 text-sm font-medium leading-normal transition-colors whitespace-nowrap ${
                filter === 'upcoming' ? 'bg-red-600 shadow-lg text-white' : 'text-white/60 hover:text-white'
              }`}>
                <span>Upcoming</span>
                <input
                  type="radio"
                  name="ticket-filter"
                  value="upcoming"
                  checked={filter === 'upcoming'}
                  onChange={() => setFilter('upcoming')}
                  className="invisible w-0"
                />
              </label>
              <label className={`flex h-full cursor-pointer items-center justify-center rounded-md px-4 text-sm font-medium leading-normal transition-colors whitespace-nowrap ${
                filter === 'past' ? 'bg-red-600 shadow-lg text-white' : 'text-white/60 hover:text-white'
              }`}>
                <span>Past</span>
                <input
                  type="radio"
                  name="ticket-filter"
                  value="past"
                  checked={filter === 'past'}
                  onChange={() => setFilter('past')}
                  className="invisible w-0"
                />
              </label>
              <label className={`flex h-full cursor-pointer items-center justify-center rounded-md px-4 text-sm font-medium leading-normal transition-colors whitespace-nowrap ${
                filter === 'all' ? 'bg-red-600 shadow-lg text-white' : 'text-white/60 hover:text-white'
              }`}>
                <span>All</span>
                <input
                  type="radio"
                  name="ticket-filter"
                  value="all"
                  checked={filter === 'all'}
                  onChange={() => setFilter('all')}
                  className="invisible w-0"
                />
              </label>
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Booking Cards */}
              {filteredBookings.map(booking => (
                <div
                  key={booking.id}
                  className="flex flex-col items-stretch gap-4 rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-white/20 hover:bg-white/10"
                >
                  <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
                    {/* Movie Poster */}
                    <Link
                      to={`/movie/${booking.showtime.movie.id}`}
                      className="w-full md:w-28 md:flex-shrink-0"
                    >
                      <div
                        className="w-full bg-center bg-no-repeat aspect-[2/3] bg-cover rounded-lg hover:opacity-80 transition-opacity"
                        style={{
                          backgroundImage: booking.showtime.movie.poster_url
                            ? `url(${booking.showtime.movie.poster_url})`
                            : 'linear-gradient(to bottom, #333, #111)',
                        }}
                      />
                    </Link>

                    {/* Booking Details */}
                    <div className="flex w-full flex-1 flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <p className="text-white/60 text-sm font-normal leading-normal">
                          {formatDate(booking.showtime.start_time)} - {formatTime(booking.showtime.start_time)}
                        </p>
                        <Link
                          to={`/movie/${booking.showtime.movie.id}`}
                          className="text-white text-xl font-bold leading-tight hover:text-red-400 transition-colors"
                        >
                          {booking.showtime.movie.title}
                        </Link>
                        <p className="text-white/60 text-sm font-normal leading-normal">
                          {booking.showtime.room.cinema.name}, {booking.showtime.room.name}
                        </p>
                      </div>

                      {/* Booking Info */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/80">
                        <span>{booking.tickets.length} Tickets</span>
                        <span className="hidden h-4 w-px bg-white/20 sm:block"></span>
                        <span>Seats: {getSeatLabels(booking.tickets)}</span>
                        <span className="hidden h-4 w-px bg-white/20 sm:block"></span>
                        <div className="flex flex-col gap-1">
                          {booking.discount_amount > 0 ? (
                            <>
                              <span className="line-through text-white/70">{formatPrice(booking.total_amount)}</span>
                              <span className="text-yellow-400">-{formatPrice(booking.discount_amount)}</span>
                              <span>{formatPrice(booking.final_amount)}</span>
                            </>
                          ) : (
                            <span>{formatPrice(booking.final_amount)}</span>
                          )}
                        </div>
                        <span className="hidden h-4 w-px bg-white/20 sm:block"></span>
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${getStatusDotColor(booking.status)}`}></span>
                          <span className={getStatusColor(booking.status)}>
                            {getStatusText(booking.status)}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        {booking.status === 'PENDING' && (
                          <Link
                            to={`/booking/payment?bookingId=${booking.id}`}
                            className="flex w-fit cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-red-600 text-white gap-2 text-sm font-bold leading-normal tracking-wide transition-transform hover:scale-105 hover:bg-red-700"
                          >
                            <CreditCard className="w-4 h-4" />
                            <span className="truncate">Pay Now</span>
                          </Link>
                        )}

                        {booking.status === 'CONFIRMED' && (
                          <button
                            onClick={() => setSelectedTicket(booking)}
                            className="flex w-fit cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-red-600/80 text-white gap-2 text-sm font-bold leading-normal tracking-wide transition-transform hover:scale-105 hover:bg-red-600"
                          >
                            <QrCode className="w-4 h-4" />
                            <span className="truncate">View E-Ticket</span>
                          </button>
                        )}

                        {booking.status === 'FAILED' && (
                          <Link
                            to={`/booking/${booking.showtime.movie.id}`}
                            className="flex w-fit cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-white/10 text-white/80 gap-2 text-sm font-bold leading-normal tracking-wide transition-colors hover:bg-white/20 hover:text-white"
                          >
                            <RefreshCw className="w-4 h-4" />
                            <span className="truncate">Retry</span>
                          </Link>
                        )}

                        {(booking.status === 'CANCELLED' || booking.status === 'REFUNDED') && (
                          <Link
                            to={`/movie/${booking.showtime.movie.id}`}
                            className="flex w-fit cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-white/10 text-white/80 gap-2 text-sm font-bold leading-normal tracking-wide transition-colors hover:bg-white/20 hover:text-white"
                          >
                            <span className="truncate">View Movie</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Empty State */}
              {filteredBookings.length === 0 && (
                <div className="mt-4 flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-white/20 bg-transparent py-16 text-center">
                  <History className="w-12 h-12 text-white/40" />
                  <div className="flex flex-col gap-1">
                    <p className="text-white text-lg font-medium">
                      {filter === 'upcoming' ? 'No upcoming tickets' : filter === 'past' ? 'No past tickets' : 'No tickets found'}
                    </p>
                    <p className="text-white/60 text-sm">
                      {filter === 'upcoming' 
                        ? 'Book tickets now to have upcoming tickets!' 
                        : 'Your booking history will appear here.'}
                    </p>
                  </div>
                  <Link
                    to="/"
                    className="mt-2 px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    Explore Movies
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* E-Ticket Modal - Display each ticket individually */}
      {selectedTicket && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedTicket(null)}
        >
          <div 
            className="bg-gray-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-white/10"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gray-900 p-6 pb-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-white text-xl font-bold">E-Ticket ({selectedTicket.tickets.length} tickets)</h3>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              <p className="text-white font-bold text-lg mt-2">{selectedTicket.showtime.movie.title}</p>
              <p className="text-gray-400 text-sm">
                {formatDate(selectedTicket.showtime.start_time)} - {formatTime(selectedTicket.showtime.start_time)}
              </p>
              <p className="text-gray-400 text-sm">
                {selectedTicket.showtime.room.cinema.name} - {selectedTicket.showtime.room.name}
              </p>
            </div>

            {/* Tickets List */}
            <div className="p-6 space-y-6">
              {selectedTicket.tickets.map((ticket, index) => (
                <div 
                  key={ticket.id}
                  className="bg-gray-800/50 rounded-xl p-4 border border-white/10"
                >
                  {/* Ticket Header */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white font-bold">Ticket {index + 1}/{selectedTicket.tickets.length}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      ticket.is_used 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {ticket.is_used ? 'Used' : 'Unused'}
                    </span>
                  </div>

                  {/* QR Code for this specific ticket */}
                  <div className="flex justify-center mb-4">
                    <div className="bg-white p-3 rounded-xl">
                      <img
                        src={ticket.qr_code_url || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=TICKET-${ticket.id}`}
                        alt={`QR Code - Seat ${ticket.seat_row}${ticket.seat_number}`}
                        className="w-36 h-36"
                      />
                    </div>
                  </div>

                  {/* Ticket Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Ticket Code</span>
                      <span className="text-white font-mono text-xs">{ticket.id.slice(0, 8)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Seat</span>
                      <span className="text-white font-bold text-lg">{ticket.seat_row}{ticket.seat_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Seat Type</span>
                      <span className="text-white">{ticket.seat_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Ticket Price</span>
                      <span className="text-green-400 font-semibold">{formatPrice(ticket.price)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-900 p-6 pt-4 border-t border-white/10">
              <div className="space-y-3">
                {selectedTicket.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Original Total</span>
                    <span className="text-white/70 line-through">{formatPrice(selectedTicket.total_amount)}</span>
                  </div>
                )}
                {selectedTicket.discount_amount > 0 && selectedTicket.promotion_code && (
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-400">Discount ({selectedTicket.promotion_code})</span>
                    <span className="text-yellow-400">-{formatPrice(selectedTicket.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-white/10 pt-3">
                  <span className="text-gray-400">Final Total</span>
                  <span className="text-white font-bold text-lg">{formatPrice(selectedTicket.final_amount)}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="w-full py-3 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors mt-4"
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
