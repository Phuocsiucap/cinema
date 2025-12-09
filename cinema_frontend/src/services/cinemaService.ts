import api from './api';
import type { Cinema, CinemaCreate, CinemaUpdate, CinemaRoom, RoomUpdate, AddRoomsRequest } from '../types/cinema';

const CINEMA_API = '/cinemas';

export const cinemaService = {
  // Tạo rạp mới
  createCinema: async (cinemaData: CinemaCreate): Promise<Cinema> => {
    return api.post<Cinema>(`${CINEMA_API}/`, cinemaData);
  },

  // Thêm phòng vào rạp
  addRoomsToCinema: async (roomsData: AddRoomsRequest): Promise<Cinema> => {
    return api.post<Cinema>(`${CINEMA_API}/rooms`, roomsData);
  },

  // Lấy danh sách rạp
  getCinemas: async (): Promise<Cinema[]> => {
    return api.get<Cinema[]>(`${CINEMA_API}/`);
  },

  // Lấy chi tiết rạp
  getCinema: async (id: string): Promise<Cinema> => {
    return api.get<Cinema>(`${CINEMA_API}/${id}`);
  },

  // Cập nhật rạp
  updateCinema: async (id: string, cinemaData: CinemaUpdate): Promise<Cinema> => {
    return api.put<Cinema>(`${CINEMA_API}/${id}`, cinemaData);
  },

  // Xóa rạp
  deleteCinema: async (id: string): Promise<void> => {
    return api.delete(`${CINEMA_API}/${id}`);
  },

  // Lấy danh sách phòng của rạp
  getCinemaRooms: async (cinemaId: string): Promise<CinemaRoom[]> => {
    return api.get<CinemaRoom[]>(`${CINEMA_API}/${cinemaId}/rooms`);
  },

  // Lấy chi tiết phòng
  getRoom: async (roomId: string): Promise<CinemaRoom> => {
    return api.get<CinemaRoom>(`${CINEMA_API}/rooms/${roomId}`);
  },

  // Cập nhật phòng
  updateRoom: async (roomId: string, roomData: RoomUpdate): Promise<CinemaRoom> => {
    return api.put<CinemaRoom>(`${CINEMA_API}/rooms/${roomId}`, roomData);
  },

  // Xóa phòng
  deleteRoom: async (roomId: string): Promise<void> => {
    return api.delete(`${CINEMA_API}/rooms/${roomId}`);
  },
};

export default cinemaService;
