import api from './api';
import type { SeatWithStatus } from '../types/cinema';

export interface ShowtimeMovie {
  id: string;
  title: string;
  poster_url?: string;
  duration_minutes: number;
}

export interface ShowtimeCinema {
  id: string;
  name: string;
  city: string;
}

export interface ShowtimeRoom {
  id: string;
  name: string;
  cinema?: ShowtimeCinema;
}

export interface Showtime {
  id: string;
  movie_id: string;
  room_id: string;
  start_time: string;
  end_time: string;
  price: number;
  movie?: ShowtimeMovie;
  room?: ShowtimeRoom;
}

export interface ShowtimeCreate {
  movie_id: string;
  room_id: string;
  start_time: string;
  price: number;
}

export interface ShowtimeUpdate {
  movie_id?: string;
  room_id?: string;
  start_time?: string;
  price?: number;
}

const SHOWTIME_API = '/showtimes';

export const showtimeService = {
  // Create new showtime
  createShowtime: async (data: ShowtimeCreate): Promise<Showtime> => {
    return api.post<Showtime>(`${SHOWTIME_API}/`, data);
  },

  // Get showtimes by movie (for admin - all times)
  getShowtimesByMovie: async (movieId: string): Promise<Showtime[]> => {
    return api.get<Showtime[]>(`${SHOWTIME_API}/movie/${movieId}`);
  },

  // Get upcoming showtimes by movie (for user - within 1 month)
  getUpcomingShowtimesByMovie: async (movieId: string): Promise<Showtime[]> => {
    return api.get<Showtime[]>(`${SHOWTIME_API}/movie/${movieId}/upcoming`);
  },

  // Get showtimes by cinema (for admin - all times)
  getShowtimesByCinema: async (cinemaId: string): Promise<Showtime[]> => {
    return api.get<Showtime[]>(`${SHOWTIME_API}/cinema/${cinemaId}`);
  },

  // Get upcoming showtimes by cinema (for user - within 1 month)
  getUpcomingShowtimesByCinema: async (cinemaId: string): Promise<Showtime[]> => {
    return api.get<Showtime[]>(`${SHOWTIME_API}/cinema/${cinemaId}/upcoming`);
  },

  // Get showtimes by room
  getShowtimesByRoom: async (roomId: string, startDate?: string, endDate?: string): Promise<Showtime[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const queryString = params.toString();
    return api.get<Showtime[]>(`${SHOWTIME_API}/room/${roomId}${queryString ? `?${queryString}` : ''}`);
  },

  // Get showtime by ID
  getShowtime: async (id: string): Promise<Showtime> => {
    return api.get<Showtime>(`${SHOWTIME_API}/${id}`);
  },

  // Update showtime
  updateShowtime: async (id: string, data: ShowtimeUpdate): Promise<Showtime> => {
    return api.put<Showtime>(`${SHOWTIME_API}/${id}`, data);
  },

  // Delete showtime
  deleteShowtime: async (id: string): Promise<void> => {
    return api.delete(`${SHOWTIME_API}/${id}`);
  },

  // Get list of showtime seats with status (available/booked)
  getShowtimeSeats: async (showtimeId: string): Promise<SeatWithStatus[]> => {
    return api.get<SeatWithStatus[]>(`${SHOWTIME_API}/${showtimeId}/seats`);
  },
};

export default showtimeService;
