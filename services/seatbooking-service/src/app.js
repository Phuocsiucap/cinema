import express from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";
import { Server } from "socket.io";
import { setupSocketIO } from "./socket.js";
import { lockSeat, unlockSeat, setIO } from "./seat.controller.js";
import { sendOTPEmail, verifyOTP, forgotPassword, resetPasswordWithOTP } from "./sendEmail.js";
import { 
    createBooking, 
    confirmBooking, 
    cancelBooking, 
    getBooking, 
    getUserBookings,
    getBookedSeats,
    checkinBooking,
    getTickets,
    setIO as setBookingIO 
} from "./booking.controller.js";
import {
    getPromotions,
    getPromotion,
    createPromotion,
    updatePromotion,
    deletePromotion,
    validatePromotionCode,
    getActivePromotions
} from "./promotion.controller.js";

dotenv.config();
const app = express();
app.use(cors({
    origin: true, // Allow all origins
    credentials: true, // Allow credentials
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-user-id"]
}));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});


setupSocketIO(io);
setIO(io);
setBookingIO(io);

// ==================== SEAT ROUTES ====================
app.post("/lock-seat", lockSeat);
app.post("/unlock-seat", unlockSeat);
app.get("/promotions/active", getActivePromotions);
app.post("/promotions/validate", validatePromotionCode);
app.get("/promotions", getPromotions);
app.post("/promotions", createPromotion);
app.get("/promotions/:id", getPromotion);
app.put("/promotions/:id", updatePromotion);
app.delete("/promotions/:id", deletePromotion);


// Tạo booking mới (sau khi đã lock ghế)
app.post("/", createBooking);

// Xác nhận thanh toán
app.post("/:bookingId/confirm", confirmBooking);

// Hủy booking
app.post("/:bookingId/cancel", cancelBooking);

// Lấy danh sách ghế đã đặt cho showtime
app.get("/showtimes/:showtimeId/booked-seats", getBookedSeats);

// ==================== TICKET ROUTES (Admin) ====================
// Lấy danh sách tickets với phân trang
app.get("/tickets", getTickets);

// Lấy danh sách booking của user
app.get("/", getUserBookings);

// Lấy thông tin booking theo ID    
app.get("/:bookingId", getBooking);

// Check-in vé (quét QR)
app.post("/:bookingId/checkin", checkinBooking);


// ==================== EMAIL ROUTES ====================
app.post("/send-otp-email", sendOTPEmail);
app.post("/verify-otp", verifyOTP);
app.post("/forgot-password", forgotPassword);
app.post("/reset-password-otp", resetPasswordWithOTP);



const PORT = process.env.PORT || 8004;

server.listen(PORT, () => console.log(`🚀 Seat Booking Service running on port ${PORT}`));