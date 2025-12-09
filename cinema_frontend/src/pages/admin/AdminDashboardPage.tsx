import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Film, 
  Building2, 
  Users, 
  Ticket, 
  TrendingUp,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  RefreshCw,
  QrCode,
  Loader2,
  X
} from 'lucide-react';
import { AdminLayout } from '../../components/layouts';
import { QRScannerModal } from '../../components/ui';
import { dashboardService } from '../../services/dashboardService';
import type { DashboardStats, TransformedTopMovie, TransformedRecentBooking } from '../../services/dashboardService';

export function AdminDashboardPage() {
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalMovies: 0,
    totalCinemas: 0,
    totalUsers: 0,
    totalTickets: 0,
    totalRevenueMonth: 0,
    todayTickets: 0,
    activeShowtimes: 0,
    newMoviesThisMonth: 0,
    newCinemasThisMonth: 0,
    newUsersThisMonth: 0,
    newTicketsThisMonth: 0,
  });
  const [recentBookings, setRecentBookings] = useState<TransformedRecentBooking[]>([]);
  const [topMovies, setTopMovies] = useState<TransformedTopMovie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<TransformedRecentBooking | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const loadDashboardData = async (isRefresh = false) => {
    // Nếu dữ liệu đã load và không phải refresh thì không load lại
    if (isDataLoaded && !isRefresh) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await dashboardService.getDashboard();
      setStats(data.stats);
      setTopMovies(data.topMovies);
      setRecentBookings(data.recentBookings);
      setIsDataLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData(true);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} hours ago`;
    return date.toLocaleDateString('en-US');
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-500/20 text-green-400';
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'CANCELLED':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'Confirmed';
      case 'PENDING':
        return 'Pending Payment';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const statCards = [
    {
      title: 'Total Movies',
      value: stats.totalMovies,
      icon: Film,
      color: 'bg-blue-500',
      link: '/admin/movies',
      change: `+${stats.newMoviesThisMonth}`,
      changeType: stats.newMoviesThisMonth > 0 ? 'up' : 'down',
    },
    {
      title: 'Total Cinemas',
      value: stats.totalCinemas,
      icon: Building2,
      color: 'bg-purple-500',
      link: '/admin/cinemas',
      change: `+${stats.newCinemasThisMonth}`,
      changeType: stats.newCinemasThisMonth > 0 ? 'up' : 'down',
    },
    {
      title: 'Users',
      value: formatNumber(stats.totalUsers),
      icon: Users,
      color: 'bg-green-500',
      link: '/admin/users',
      change: `+${stats.newUsersThisMonth}`,
      changeType: stats.newUsersThisMonth > 0 ? 'up' : 'down',
    },
    {
      title: 'Total Tickets Sold',
      value: formatNumber(stats.totalTickets),
      icon: Ticket,
      color: 'bg-orange-500',
      link: '/admin/bookings',
      change: `+${stats.newTicketsThisMonth}`,
      changeType: stats.newTicketsThisMonth > 0 ? 'up' : 'down',
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400 mt-1">Cinema Management System Overview</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsQRScannerOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <QrCode size={18} />
              Scan Ticket
            </button>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={40} className="animate-spin text-red-500" />
          </div>
        ) : (
          <>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <Link
              key={index}
              to={stat.link}
              className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon size={24} className="text-white" />
                </div>
                <div className={`flex items-center gap-1 text-sm ${
                  stat.changeType === 'up' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {stat.changeType === 'up' ? (
                    <ArrowUpRight size={16} />
                  ) : (
                    <ArrowDownRight size={16} />
                  )}
                  {stat.change}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-gray-400 text-sm">{stat.title}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Revenue Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Revenue</h2>
                <p className="text-gray-400 text-sm">Total revenue from ticket bookings</p>
              </div>
              <div className="flex items-center gap-2 text-green-400">
                <TrendingUp size={20} />
                <span className="text-sm">+12.5%</span>
              </div>
            </div>
            <div className="flex items-end gap-4">
              <div>
                <p className="text-gray-400 text-sm">Revenue this month</p>
                <p className="text-3xl font-bold text-amber-400 mt-1">
                  {formatPrice(stats.totalRevenueMonth)}
                </p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-800">
              <div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar size={16} />
                  <span className="text-sm">Tickets today</span>
                </div>
                <p className="text-xl font-bold text-white mt-1">{stats.todayTickets} vé</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Ticket size={16} />
                  <span className="text-sm">Tickets this month</span>
                </div>
                <p className="text-xl font-bold text-green-400 mt-1">{stats.newTicketsThisMonth} vé</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Film size={16} />
                  <span className="text-sm">Showtimes today</span>
                </div>
                <p className="text-xl font-bold text-white mt-1">{stats.activeShowtimes} suất</p>
              </div>
            </div>
          </div>

          {/* Top Movies */}
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Top Movies</h2>
              <Link to="/admin/movies" className="text-red-500 hover:text-red-400 text-sm">
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {topMovies.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">No data available</p>
              ) : (
                topMovies.map((movie, index) => (
                  <div key={movie.id} className="flex items-center gap-3">
                    <span className="text-gray-500 text-sm w-4">{index + 1}</span>
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="w-10 h-14 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{movie.title}</p>
                      <p className="text-gray-400 text-xs">{movie.ticketsSold} vé</p>
                    </div>
                    <p className="text-amber-400 text-sm font-medium">
                      {formatPrice(movie.revenue)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div>
              <h2 className="text-lg font-semibold text-white">Recent Bookings</h2>
              <p className="text-gray-400 text-sm">Latest transactions</p>
            </div>
            <Link 
              to="/admin/bookings"
              className="text-red-500 hover:text-red-400 text-sm flex items-center gap-1"
            >
              View all
              <ArrowUpRight size={16} />
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Booking ID</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Customer</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Seats</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Total Amount</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Status</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Time</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-gray-400 py-8">No bookings yet</td>
                  </tr>
                ) : (
                  recentBookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="px-6 py-4">
                        <span className="text-white font-mono text-xs">{booking.id.slice(0, 8)}...</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-300 text-sm">{booking.customerName}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-400 text-sm">{booking.seats}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-amber-400 text-sm font-medium">
                          {formatPrice(booking.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {getStatusText(booking.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-400 text-sm">{formatTime(booking.createdAt)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => setSelectedBooking(booking)}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <Eye size={16} className="text-gray-400 hover:text-white" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/admin/movies/add"
            className="flex items-center gap-4 bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 hover:border-red-500/50 hover:bg-red-500/5 transition-all group"
          >
            <div className="p-3 bg-red-500/20 rounded-lg group-hover:bg-red-500/30">
              <Film size={24} className="text-red-500" />
            </div>
            <div>
              <p className="text-white font-medium">Add New Movie</p>
              <p className="text-gray-400 text-sm">Add movie to system</p>
            </div>
          </Link>
          
          <Link
            to="/admin/cinemas/add"
            className="flex items-center gap-4 bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group"
          >
            <div className="p-3 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30">
              <Building2 size={24} className="text-purple-500" />
            </div>
            <div>
              <p className="text-white font-medium">Add New Cinema</p>
              <p className="text-gray-400 text-sm">Expand cinema network</p>
            </div>
          </Link>
          
          <Link
            to="/admin/showtimes"
            className="flex items-center gap-4 bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 hover:border-green-500/50 hover:bg-green-500/5 transition-all group"
          >
            <div className="p-3 bg-green-500/20 rounded-lg group-hover:bg-green-500/30">
              <Clock size={24} className="text-green-500" />
            </div>
            <div>
              <p className="text-white font-medium">Manage Showtimes</p>
              <p className="text-gray-400 text-sm">Create and schedule showtimes</p>
            </div>
          </Link>
          
          <Link
            to="/admin/users"
            className="flex items-center gap-4 bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
          >
            <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30">
              <Users size={24} className="text-blue-500" />
            </div>
            <div>
              <p className="text-white font-medium">Manage Users</p>
              <p className="text-gray-400 text-sm">View and manage accounts</p>
            </div>
          </Link>
        </div>
          </>
        )}
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setSelectedBooking(null)}
        >
          <div 
            className="bg-gray-900 rounded-2xl max-w-md w-full mx-4 border border-gray-700"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Booking Details</h2>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Booking ID */}
              <div className="bg-gray-800/50 rounded-lg p-3">
                <span className="text-gray-400 text-sm block mb-1">Booking ID</span>
                <span className="text-white font-mono text-sm break-all">{selectedBooking.id}</span>
              </div>

              {/* Grid info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                      <span className="text-gray-400 text-sm block mb-1">Customer</span>
                  <span className="text-white">{selectedBooking.customerName}</span>
                </div>
                <div>
                      <span className="text-gray-400 text-sm block mb-1">Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedBooking.status)}`}>
                    {getStatusText(selectedBooking.status)}
                  </span>
                </div>
              </div>

              {/* Seats */}
              <div>
                    <span className="text-gray-400 text-sm block mb-2">Booked Seats</span>
                <div className="flex flex-wrap gap-2">
                  {selectedBooking.seats.split(', ').map((seat, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium"
                    >
                      {seat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Booking Time */}
              <div className="bg-gray-800/50 rounded-lg p-3">
                <span className="text-gray-400 text-sm block mb-1">Booking Time</span>
                <div className="flex items-center gap-2 text-white">
                  <Calendar size={16} className="text-gray-400" />
                  <span>{formatDateTime(selectedBooking.createdAt)}</span>
                </div>
              </div>

              {/* Final Amount */}
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <span className="text-gray-400 text-sm block mb-1">Final Amount</span>
                <span className="text-green-400 text-2xl font-bold">{formatPrice(selectedBooking.amount)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 pt-0 space-y-3">
              <Link
                to={`/admin/tickets?search=${selectedBooking.id}`}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Eye size={18} />
                View Full Details
              </Link>
              <button
                onClick={() => setSelectedBooking(null)}
                className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      <QRScannerModal 
        isOpen={isQRScannerOpen} 
        onClose={() => setIsQRScannerOpen(false)} 
      />
    </AdminLayout>
  );
}

export default AdminDashboardPage;
