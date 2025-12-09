import { io, Socket } from 'socket.io-client';
import api from './api';

const BOOKING_API = '/bookings';

// Socket instance
let socket: Socket | null = null;
let bookingServiceUrl: string | null = null;

// Types
export interface LockedSeat {
  seat_id: string;
  user_id: string;
  ttl: number;
}

export interface SeatUpdateEvent {
  event: 'seat_locked' | 'seat_unlocked' | 'seat_expired';
  showtime_id: string;
  seat_id: string;
  user_id?: string;
  message?: string;
}

export interface SeatStatusEvent {
  showtime_id: string;
  locked_seats: LockedSeat[];
}

export interface LockSeatResponse {
  success: boolean;
  message: string;
  locked_seats?: string[];
  failed_seats?: { seat_id: string; reason: string }[];
}

export interface UnlockSeatResponse {
  success: boolean;
  message: string;
  unlocked_seats?: string[];
  failed_seats?: { seat_id: string; reason: string }[];
}

// Booking Types
export interface CreateBookingResponse {
  success: boolean;
  message: string;
  data?: {
    booking_id: string;
    showtime_id: string;
    seats: { seat_id: string; seat_type: string; price: number }[];
    total_amount: number;
    status: string;
  };
}

export interface ConfirmBookingResponse {
  success: boolean;
  message: string;
  data?: {
    booking_id: string;
    status: string;
  };
}

export interface BookingTicket {
  id: string;
  seat_id: string;
  seat_row: string;
  seat_number: number;
  seat_type: string;
  price: number;
  qr_code_url?: string;
  is_used: boolean;
}

export interface BookingDetail {
  id: string;
  user_id: string;
  showtime_id: string;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  promotion_code?: string;
  promotion_title?: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED' | 'FAILED';
  payment_method?: string;
  transaction_reference?: string;
  created_at: string;
  updated_at: string;
  showtime: {
    id: string;
    start_time: string;
    end_time: string;
    price: number;
    movie: {
      id: string;
      title: string;
      poster_url: string;
      duration_minutes: number;
    };
    room: {
      id: string;
      name: string;
      cinema: {
        id: string;
        name: string;
        city: string;
      };
    };
  };
  tickets: BookingTicket[];
}

export interface GetBookingsResponse {
  success: boolean;
  data?: BookingDetail[];
}

export interface GetBookingResponse {
  success: boolean;
  data?: BookingDetail;
}

export interface BookedSeatsResponse {
  success: boolean;
  data?: {
    showtime_id: string;
    booked_seats: string[];
  };
}

// Get booking service URL from API Gateway (for WebSocket connection)
async function getBookingServiceUrl(): Promise<string> {
  if (bookingServiceUrl) {
    return bookingServiceUrl;
  }

  try {
    const url = await api.get<string>(`${BOOKING_API}/`);
    // Remove quotes if present
    bookingServiceUrl = typeof url === 'string' ? url.replace(/"/g, '') : 'http://localhost:8004';
    return bookingServiceUrl;
  } catch (error) {
    console.error('Error getting booking service URL:', error);
    // Fallback to default
    return 'http://localhost:8004';
  }
}

// Connect to Socket.IO
export async function connectSocket(): Promise<Socket> {
  if (socket?.connected) {
    return socket;
  }

  const serviceUrl = await getBookingServiceUrl();

  socket = io(serviceUrl, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('✅ Connected to booking service:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Disconnected from booking service:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
}

// Disconnect socket
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// Get current socket
export function getSocket(): Socket | null {
  return socket;
}

// Join showtime room
export function joinShowtimeRoom(showtimeId: string): void {
  if (socket?.connected) {
    socket.emit('join_showtime', showtimeId);
    console.log('📌 Joined showtime room:', showtimeId);
  }
}

// Leave showtime room
export function leaveShowtimeRoom(showtimeId: string): void {
  if (socket?.connected) {
    socket.emit('leave_showtime', showtimeId);
    console.log('📌 Left showtime room:', showtimeId);
  }
}

// Listen for seat updates
export function onSeatUpdate(callback: (data: SeatUpdateEvent) => void): void {
  if (socket) {
    socket.on('seat_update', callback);
  }
}

// Listen for initial seat status
export function onSeatStatus(callback: (data: SeatStatusEvent) => void): void {
  if (socket) {
    socket.on('seat_status', callback);
  }
}

// Remove listeners
export function offSeatUpdate(): void {
  if (socket) {
    socket.off('seat_update');
  }
}

export function offSeatStatus(): void {
  if (socket) {
    socket.off('seat_status');
  }
}

// ==================== SEAT LOCK API CALLS ====================

// Lock seats
export async function lockSeats(showtimeId: string, seatIds: string[]): Promise<LockSeatResponse> {
  return api.post<LockSeatResponse>(`${BOOKING_API}/lock-seat`, {
    showtime_id: showtimeId,
    seat_ids: seatIds,
  });
}

// Unlock seats
export async function unlockSeats(showtimeId: string, seatIds: string[]): Promise<UnlockSeatResponse> {
  return api.post<UnlockSeatResponse>(`${BOOKING_API}/unlock-seat`, {
    showtime_id: showtimeId,
    seat_ids: seatIds,
  });
}

// Get seat status
export async function getSeatStatus(showtimeId: string): Promise<{ locked_seats: LockedSeat[] }> {
  return api.get<{ locked_seats: LockedSeat[] }>(`${BOOKING_API}/seat-status/${showtimeId}`);
}

// ==================== BOOKING API CALLS ====================

// Create a new booking
export async function createBooking(
  showtimeId: string,
  seatIds: string[],
  userId?: string,
  promotionCode?: string
): Promise<CreateBookingResponse> {
  return api.post<CreateBookingResponse>(`${BOOKING_API}/`, {
    showtime_id: showtimeId,
    seat_ids: seatIds,
    promotion_code: promotionCode,
  });
}

// Confirm payment
export async function confirmBooking(
  bookingId: string,
  paymentMethod?: string,
  transactionReference?: string
): Promise<ConfirmBookingResponse> {
  return api.post<ConfirmBookingResponse>(`${BOOKING_API}/${bookingId}/confirm`, {
    payment_method: paymentMethod,
    transaction_reference: transactionReference,
  });
}

// Cancel booking
export async function cancelBooking(bookingId: string): Promise<{ success: boolean; message: string }> {
  return api.post<{ success: boolean; message: string }>(`${BOOKING_API}/${bookingId}/cancel`, {});
}

// Get booking details
export async function getBooking(bookingId: string): Promise<GetBookingResponse> {
  return api.get<GetBookingResponse>(`${BOOKING_API}/${bookingId}`);
}

// Get user bookings
export async function getUserBookings(
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED',
  limit: number = 20,
  offset: number = 0
): Promise<GetBookingsResponse> {
  let url = `${BOOKING_API}?limit=${limit}&offset=${offset}`;
  if (status) {
    url += `&status=${status}`;
  }
  return api.get<GetBookingsResponse>(url);
}

// Get booked seats for a showtime
export async function getBookedSeats(showtimeId: string): Promise<BookedSeatsResponse> {
  return api.get<BookedSeatsResponse>(`${BOOKING_API}/showtimes/${showtimeId}/booked-seats`);
}

// Check-in ticket (by seat_booking_id or all seats in booking)
export async function checkinBooking(
  bookingId: string, 
  seatBookingId?: string
): Promise<{ success: boolean; message: string; data?: unknown }> {
  return api.post<{ success: boolean; message: string; data?: unknown }>(`${BOOKING_API}/${bookingId}/checkin`, {
    seat_booking_id: seatBookingId,
  });
}

// Get tickets list (admin)
export async function getTickets(
  page: number = 1,
  limit: number = 10,
  status?: string,
  movie?: string,
  search?: string,
  date?: string
): Promise<unknown> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (status && status !== 'all') params.append('status', status);
  if (movie && movie !== 'all') params.append('movie', movie);
  if (search) params.append('search', search);
  if (date && date !== 'all') params.append('date', date);
  
  return api.get(`${BOOKING_API}/tickets?${params.toString()}`);
}

// Listen for booking events
export function onBookingCreated(callback: (data: { booking_id: string; showtime_id: string; seat_ids: string[]; user_id: string; status: string }) => void): void {
  if (socket) {
    socket.on('booking_created', callback);
  }
}

export function onSeatsBooked(callback: (data: { booking_id: string; showtime_id: string; seat_ids: string[]; user_id: string }) => void): void {
  if (socket) {
    socket.on('seats_booked', callback);
  }
}

export function onBookingCancelled(callback: (data: { booking_id: string; showtime_id: string; seat_ids: string[]; user_id: string }) => void): void {
  if (socket) {
    socket.on('booking_cancelled', callback);
  }
}

export function offBookingEvents(): void {
  if (socket) {
    socket.off('booking_created');
    socket.off('seats_booked');
    socket.off('booking_cancelled');
  }
}

export const bookingService = {
  // Socket functions
  connectSocket,
  disconnectSocket,
  getSocket,
  joinShowtimeRoom,
  leaveShowtimeRoom,
  onSeatUpdate,
  onSeatStatus,
  offSeatUpdate,
  offSeatStatus,
  onBookingCreated,
  onSeatsBooked,
  onBookingCancelled,
  offBookingEvents,
  // Seat Lock APIs
  lockSeats,
  unlockSeats,
  getSeatStatus,
  // Booking APIs
  createBooking,
  confirmBooking,
  cancelBooking,
  getBooking,
  getUserBookings,
  getBookedSeats,
  checkinBooking,
  getTickets,
};

export default bookingService;
