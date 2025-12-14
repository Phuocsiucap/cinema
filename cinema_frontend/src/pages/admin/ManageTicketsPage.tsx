import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, QrCode, Eye, ChevronLeft, ChevronRight, X, CheckCircle } from 'lucide-react';
import { AdminLayout } from '../../components/layouts';
import { QRScannerModal } from '../../components/ui';
import { bookingService } from '../../services';

interface Booking {
  bookingId: string;
  userId: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  promotionCode?: string;
  promotionTitle?: string;
  bookingStatus: string;
  paymentMethod: string;
  bookingDate: string;
  showtimeId: string;
  showtime: string;
  showtimeRaw: string;
  endTime: string;
  basePrice: number;
  movieId: string;
  movieTitle: string;
  posterUrl: string;
  durationMinutes: number;
  cinemaId: string;
  cinemaName: string;
  cinemaCity: string;
  cinemaAddress: string;
  roomId: string;
  roomName: string;
  totalSeats: number;
  seats: string;
  seatTypes: string;
  seatDetails: Array<{
    seatBookingId: string;
    seatId: string;
    row: string;
    number: number;
    seatType: string;
    price: number;
    isUsed: boolean;
    qrCodeUrl: string;
  }>;
  status: 'used' | 'partial' | 'inactive' | 'expired';
  usedSeats: number;
  unusedSeats: number;
}

interface Movie {
  id: string;
  title: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type StatusFilter = 'all' | 'used' | 'partial' | 'inactive' | 'expired';

export function ManageTicketsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [movieFilter, setMovieFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadBookings = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await bookingService.getTickets(
        page,
        pagination.limit,
        statusFilter,
        movieFilter,
        debouncedSearch,
        dateFilter
      ) as {
        success: boolean;
        message?: string;
        data: {
          bookings: Booking[];
          pagination: Pagination;
          movies?: Movie[];
        };
      };

      if (data.success) {
        setBookings(data.data.bookings || []);
        setPagination(data.data.pagination);
        if (data.data.movies) {
          setMovies(data.data.movies);
        }
      } else {
        setError(data.message || 'Failed to load bookings');
        setBookings([]);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load bookings');
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, movieFilter, debouncedSearch, dateFilter, pagination.limit]);

  useEffect(() => {
    loadBookings(1);
  }, [statusFilter, movieFilter, debouncedSearch, dateFilter]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadBookings(newPage);
    }
  };

  const handleCheckin = async (booking: any) => {
    try {
      const data = await bookingService.checkinBooking(booking.bookingId);

      if (data.success) {
        loadBookings(pagination.page);
        // Update the selected booking data if it's the same booking
        if (selectedBooking && selectedBooking.bookingId === booking.bookingId) {
          setSelectedBooking({
            ...selectedBooking,
            status: 'used'
          });
        }
        alert('Booking activated successfully');
      } else {
        alert(data.message || 'Cannot activate booking');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while activating the booking';
      console.error('Failed to activate booking:', errorMessage);
      alert(errorMessage);
    }
  };

  const handleViewDetail = (booking: any) => {
    setSelectedBooking(booking);
    setIsDetailModalOpen(true);
  };

  const handleCheckinSeat = async (seatBookingId: string) => {
    try {
      const data = await bookingService.checkinSeatBooking(seatBookingId);

      if (data.success) {
        loadBookings(pagination.page);
        // Update the selected booking data
        if (selectedBooking) {
          setSelectedBooking({
            ...selectedBooking,
            seatDetails: selectedBooking.seatDetails.map(seat => 
              seat.seatBookingId === seatBookingId 
                ? { ...seat, isUsed: true }
                : seat
            ),
            usedSeats: selectedBooking.usedSeats + 1,
            unusedSeats: selectedBooking.unusedSeats - 1,
            status: selectedBooking.usedSeats + 1 === selectedBooking.totalSeats 
              ? 'used' 
              : selectedBooking.usedSeats + 1 > 0 
                ? 'partial' 
                : 'inactive'
          });
        }
      } else {
        alert(data.message || 'Cannot check-in seat');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while checking in the seat';
      console.error('Failed to checkin seat:', errorMessage);
      alert(errorMessage);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'used':
        return (
          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
            Used
          </span>
        );
      case 'partial':
        return (
          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">
            Partially Used
          </span>
        );
      case 'inactive':
        return (
          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
            Unused
          </span>
        );
      case 'expired':
        return (
          <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
            Expired
          </span>
        );
      default:
        return null;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Manage Tickets</h1>
          <button
            onClick={() => setIsQRScannerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            <QrCode size={18} />
            Scan Ticket
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400">
            {error}
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search by Ticket ID, movie, user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
              <Filter size={18} />
            </button>
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-3">
            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="appearance-none pl-3 pr-8 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-gray-600 cursor-pointer"
              >
                <option value="all">Status: All</option>
                <option value="inactive">Unused</option>
                <option value="partial">Partially Used</option>
                <option value="used">Used</option>
                <option value="expired">Expired</option>
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Movie Filter */}
            <div className="relative">
              <select
                value={movieFilter}
                onChange={(e) => setMovieFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-gray-600 cursor-pointer max-w-[200px]"
              >
                <option value="all">Movie: All</option>
                {movies.map(movie => (
                  <option key={movie.id} value={movie.id}>{movie.title}</option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Date Filter */}
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-gray-600 cursor-pointer"
              >
                <option value="all">Date: All</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Booking ID</th>
                    <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Movie</th>
                    <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Showtime</th>
                    <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Seats</th>
                    <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Total Amount</th>
                    <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Status</th>
                    <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.bookingId} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="px-6 py-4">
                        <span className="text-gray-400 font-mono text-xs">{booking.bookingId.slice(0, 8)}...</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {booking.posterUrl && (
                            <img 
                              src={booking.posterUrl} 
                              alt={booking.movieTitle}
                              className="w-10 h-14 object-cover rounded"
                            />
                          )}
                          <span className="text-white font-medium text-sm max-w-[150px] truncate">{booking.movieTitle}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-300 text-sm">{booking.showtime}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-300 text-sm">
                          {booking.seats.split(', ').length > 3 
                            ? `${booking.seats.split(', ').slice(0, 3).join(', ')}... (+${booking.seats.split(', ').length - 3})`
                            : booking.seats
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-green-400 font-semibold text-sm">{formatCurrency(booking.finalAmount)}</span>
                          {booking.discountAmount > 0 && (
                            <span className="text-gray-500 text-xs line-through">{formatCurrency(booking.totalAmount)}</span>
                          )}
                          {booking.promotionCode && (
                            <span className="text-yellow-400 text-xs">{booking.promotionCode}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(booking.status)}
                        {booking.status === 'partial' && (
                          <span className="ml-2 text-gray-500 text-xs">({booking.usedSeats}/{booking.totalSeats})</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetail(booking)}
                            className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          {booking.status === 'inactive' && (
                            <button
                              onClick={() => handleCheckin(booking)}
                              className="p-2 hover:bg-green-600/20 rounded-lg text-green-400 hover:text-green-300 transition-colors"
                              title="Activate Ticket"
                            >
                              <CheckCircle size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {bookings.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <QrCode size={32} className="text-gray-600" />
                  </div>
                  <p className="text-gray-400 text-lg font-medium">No bookings found</p>
                  <p className="text-gray-500 text-sm mt-1">Try adjusting the filters or search keywords</p>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
              <div className="text-gray-400 text-sm">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} bookings
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="p-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        pagination.page === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Booking Detail Modal */}
        {isDetailModalOpen && selectedBooking && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setIsDetailModalOpen(false)}
          >
            <div 
              className="bg-gray-900 rounded-2xl max-w-lg w-full mx-4 border border-gray-700 max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Header with poster */}
              <div className="relative">
                {selectedBooking.posterUrl && (
                  <div className="h-32 overflow-hidden rounded-t-2xl">
                    <img 
                      src={selectedBooking.posterUrl} 
                      alt={selectedBooking.movieTitle}
                      className="w-full h-full object-cover object-top opacity-40"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900" />
                  </div>
                )}
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-1">{selectedBooking.movieTitle}</h2>
                <div className="flex items-center gap-2 mb-6">
                  {getStatusBadge(selectedBooking.status)}
                  {selectedBooking.status === 'partial' && (
                    <span className="text-gray-500 text-sm">({selectedBooking.usedSeats}/{selectedBooking.totalSeats} seats used)</span>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Booking ID */}
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <span className="text-gray-400 text-sm block mb-1">Booking ID</span>
                    <span className="text-white font-mono text-sm break-all">{selectedBooking.bookingId}</span>
                  </div>

                  {/* Grid info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-400 text-sm block mb-1">Cinema</span>
                      <span className="text-white">{selectedBooking.cinemaName}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm block mb-1">Room</span>
                      <span className="text-white">{selectedBooking.roomName}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm block mb-1">Showtime</span>
                      <span className="text-white">{selectedBooking.showtime}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm block mb-1">Booking Date</span>
                      <span className="text-white">{formatDate(selectedBooking.bookingDate)}</span>
                    </div>
                  </div>

                  {/* Seats */}
                  <div>
                    <span className="text-gray-400 text-sm block mb-2">Seats ({selectedBooking.totalSeats} seats)</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {selectedBooking.seatDetails.map((seat) => (
                        <div 
                          key={seat.seatBookingId}
                          className={`p-2 rounded-lg border text-sm font-medium flex items-center justify-between ${
                            seat.isUsed 
                              ? 'bg-green-500/20 border-green-500/30 text-green-400'
                              : 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                          }`}
                        >
                          <span>{seat.row}{seat.number} ({seat.seatType})</span>
                          {!seat.isUsed && (
                            <button
                              onClick={() => handleCheckinSeat(seat.seatBookingId)}
                              className="ml-2 p-1 hover:bg-green-600/20 rounded text-green-400 hover:text-green-300 transition-colors"
                              title="Check-in this seat"
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Seat Types */}
                  {selectedBooking.seatTypes && (
                    <div>
                      <span className="text-gray-400 text-sm block mb-1">Seat Types</span>
                      <span className="text-white">{selectedBooking.seatTypes}</span>
                    </div>
                  )}

                  {/* User ID */}
                  <div>
                    <span className="text-gray-400 text-sm block mb-1">User ID</span>
                    <span className="text-white font-mono text-sm">{selectedBooking.userId}</span>
                  </div>

                  {/* Total Amount */}
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400 text-sm">Final Amount</span>
                      <span className="text-green-400 text-2xl font-bold">{formatCurrency(selectedBooking.finalAmount)}</span>
                    </div>
                    {selectedBooking.discountAmount > 0 && (
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-gray-500">Original Amount</span>
                        <span className="text-gray-400 line-through">{formatCurrency(selectedBooking.totalAmount)}</span>
                      </div>
                    )}
                    {selectedBooking.discountAmount > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-yellow-400">Discount {selectedBooking.promotionCode && `(${selectedBooking.promotionCode})`}</span>
                        <span className="text-yellow-400">-{formatCurrency(selectedBooking.discountAmount)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 space-y-3">
                  {selectedBooking.status === 'inactive' && (
                    <button
                      onClick={() => handleCheckin(selectedBooking)}
                      className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={20} />
                      Activate All Seats
                    </button>
                  )}
                  {selectedBooking.status === 'partial' && (
                    <button
                      onClick={() => handleCheckin(selectedBooking)}
                      className="w-full py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={20} />
                      Activate Remaining Seats
                    </button>
                  )}
                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QR Scanner Modal */}
        <QRScannerModal
          isOpen={isQRScannerOpen}
          onClose={() => {
            setIsQRScannerOpen(false);
            // Reload bookings after scanning
            loadBookings(pagination.page);
          }}
        />
      </div>
    </AdminLayout>
  );
}

export default ManageTicketsPage;