// Seat Types
export type SeatType = 'STANDARD' | 'VIP' | 'COUPLE';
export type SeatStatus = 'available' | 'booked';

// Seat interfaces
export interface SeatCreate {
  row: string;
  number: number;
  seat_type: SeatType;
  is_active?: boolean; // false = broken seat/aisle
}

export interface Seat {
  id: string;
  room_id: string;
  row: string;
  number: number;
  seat_type: SeatType;
  is_active: boolean;
}

export interface SeatWithStatus extends Seat {
  status: SeatStatus;
}

// Room interfaces
export interface RoomCreate {
  name: string;
  seats: SeatCreate[];
}

export interface RoomUpdate {
  name?: string;
  seats?: SeatCreate[];  // If seats provided, will replace all seats
}

export interface CinemaRoom {
  id: string;
  cinema_id: string;
  name: string;
  seat_count: number;
  seats: Seat[];
}

// Cinema interfaces
export interface CinemaCreate {
  name: string;
  address: string;
  city: string;
  description?: string;
  latitude?: number;
  longitude?: number;
}

export interface CinemaUpdate {
  name?: string;
  address?: string;
  city?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  is_active?: boolean;
}

export interface Cinema {
  id: string;
  name: string;
  address: string;
  city: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  total_rooms: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  rooms: CinemaRoom[];
}

// Request interfaces
export interface AddRoomsRequest {
  cinema_id: string;
  rooms: RoomCreate[];
}

// Filter interfaces
export interface CinemaFilters {
  search?: string;
  city?: string;
  is_active?: boolean;
}
