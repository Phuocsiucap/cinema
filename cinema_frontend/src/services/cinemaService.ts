import api from './api';
import type { Cinema, CinemaCreate, CinemaUpdate, CinemaRoom, RoomUpdate, AddRoomsRequest } from '../types/cinema';

const CINEMA_API = '/cinemas';

export const cinemaService = {
  // Create new cinema
  createCinema: async (cinemaData: CinemaCreate): Promise<Cinema> => {
    return api.post<Cinema>(`${CINEMA_API}/`, cinemaData);
  },

  // Add rooms to cinema
  addRoomsToCinema: async (roomsData: AddRoomsRequest): Promise<Cinema> => {
    return api.post<Cinema>(`${CINEMA_API}/rooms`, roomsData);
  },

  // Get list of cinemas
  getCinemas: async (): Promise<Cinema[]> => {
    return api.get<Cinema[]>(`${CINEMA_API}/`);
  },

  // Get cinema details
  getCinema: async (id: string): Promise<Cinema> => {
    return api.get<Cinema>(`${CINEMA_API}/${id}`);
  },

  // Update cinema
  updateCinema: async (id: string, cinemaData: CinemaUpdate): Promise<Cinema> => {
    return api.put<Cinema>(`${CINEMA_API}/${id}`, cinemaData);
  },

  // Delete cinema
  deleteCinema: async (id: string): Promise<void> => {
    return api.delete(`${CINEMA_API}/${id}`);
  },

  // Get list of cinema rooms
  getCinemaRooms: async (cinemaId: string): Promise<CinemaRoom[]> => {
    return api.get<CinemaRoom[]>(`${CINEMA_API}/${cinemaId}/rooms`);
  },

  // Get room details
  getRoom: async (roomId: string): Promise<CinemaRoom> => {
    return api.get<CinemaRoom>(`${CINEMA_API}/rooms/${roomId}`);
  },

  // Update room
  updateRoom: async (roomId: string, roomData: RoomUpdate): Promise<CinemaRoom> => {
    return api.put<CinemaRoom>(`${CINEMA_API}/rooms/${roomId}`, roomData);
  },

  // Delete room
  deleteRoom: async (roomId: string): Promise<void> => {
    return api.delete(`${CINEMA_API}/rooms/${roomId}`);
  },
};

export default cinemaService;
