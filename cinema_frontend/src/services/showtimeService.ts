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
  // Tạo showtime mới
  createShowtime: async (data: ShowtimeCreate): Promise<Showtime> => {
    return api.post<Showtime>(`${SHOWTIME_API}/`, data);
  },

  // Lấy showtimes theo movie
  getShowtimesByMovie: async (movieId: string): Promise<Showtime[]> => {
    return api.get<Showtime[]>(`${SHOWTIME_API}/movie/${movieId}`);
  },

  // Lấy showtimes theo cinema
  getShowtimesByCinema: async (cinemaId: string): Promise<Showtime[]> => {
    return api.get<Showtime[]>(`${SHOWTIME_API}/cinema/${cinemaId}`);
  },

  // Lấy showtimes theo room
  getShowtimesByRoom: async (roomId: string, startDate?: string, endDate?: string): Promise<Showtime[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const queryString = params.toString();
    return api.get<Showtime[]>(`${SHOWTIME_API}/room/${roomId}${queryString ? `?${queryString}` : ''}`);
  },

  // Lấy showtime theo ID
  getShowtime: async (id: string): Promise<Showtime> => {
    return api.get<Showtime>(`${SHOWTIME_API}/${id}`);
  },

  // Cập nhật showtime
  updateShowtime: async (id: string, data: ShowtimeUpdate): Promise<Showtime> => {
    return api.put<Showtime>(`${SHOWTIME_API}/${id}`, data);
  },

  // Xóa showtime
  deleteShowtime: async (id: string): Promise<void> => {
    return api.delete(`${SHOWTIME_API}/${id}`);
  },

  // Lấy danh sách ghế của showtime kèm trạng thái (available/booked)
  getShowtimeSeats: async (showtimeId: string): Promise<SeatWithStatus[]> => {
    return api.get<SeatWithStatus[]>(`${SHOWTIME_API}/${showtimeId}/seats`);
  },
};

export default showtimeService;
