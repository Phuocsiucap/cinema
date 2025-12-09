import api from './api';

// API Response types (matching backend schema)
export interface BasicStats {
  total_movies: number;
  total_cinemas: number;
  total_users: number;
  total_tickets: number;
  new_movies_this_month: number;
  new_cinemas_this_month: number;
  new_users_this_month: number;
  new_tickets_this_month: number;
}

export interface RevenueStats {
  total_revenue_month: number;
  total_new_tickets_now: number;
  total_showtimes_now: number;
}

export interface TopMovie {
  id: string;
  movie_name: string;
  tickets_sold: number;
  revenue: number;
  poster_url: string;
}

export interface RecentBooking {
  id: string;
  created_time: string;
  total: number;
  user_name: string;
  name_of_steats: string[];
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'CHECKED_IN';
}

export interface DashboardResponse {
  basic_stats: BasicStats;
  revenue_stats: RevenueStats;
  top_movies: TopMovie[];
  recent_bookings: RecentBooking[];
}

// Transformed types for frontend use
export interface DashboardStats {
  totalMovies: number;
  totalCinemas: number;
  totalUsers: number;
  totalTickets: number;
  totalRevenueMonth: number;
  todayTickets: number;
  activeShowtimes: number;
  newMoviesThisMonth: number;
  newCinemasThisMonth: number;
  newUsersThisMonth: number;
  newTicketsThisMonth: number;
}

export interface TransformedTopMovie {
  id: string;
  title: string;
  poster: string;
  ticketsSold: number;
  revenue: number;
}

export interface TransformedRecentBooking {
  id: string;
  customerName: string;
  seats: string;
  amount: number;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'CHECKED_IN';
  createdAt: string;
}

export interface TransformedDashboard {
  stats: DashboardStats;
  topMovies: TransformedTopMovie[];
  recentBookings: TransformedRecentBooking[];
}

export const dashboardService = {
  async getDashboard(): Promise<TransformedDashboard> {
    const response = await api.get<DashboardResponse>('/dashboard/');
    
    // Transform the response to frontend-friendly format
    return {
      stats: {
        totalMovies: response.basic_stats.total_movies,
        totalCinemas: response.basic_stats.total_cinemas,
        totalUsers: response.basic_stats.total_users,
        totalTickets: response.basic_stats.total_tickets,
        totalRevenueMonth: response.revenue_stats.total_revenue_month,
        todayTickets: response.revenue_stats.total_new_tickets_now,
        activeShowtimes: response.revenue_stats.total_showtimes_now,
        newMoviesThisMonth: response.basic_stats.new_movies_this_month,
        newCinemasThisMonth: response.basic_stats.new_cinemas_this_month,
        newUsersThisMonth: response.basic_stats.new_users_this_month,
        newTicketsThisMonth: response.basic_stats.new_tickets_this_month,
      },
      topMovies: response.top_movies.map(movie => ({
        id: movie.id,
        title: movie.movie_name,
        poster: movie.poster_url,
        ticketsSold: movie.tickets_sold,
        revenue: movie.revenue,
      })),
      recentBookings: response.recent_bookings.map(booking => ({
        id: booking.id,
        customerName: booking.user_name,
        seats: booking.name_of_steats.join(', '),
        amount: booking.total,
        status: booking.status,
        createdAt: booking.created_time,
      })),
    };
  },
};

export default dashboardService;
