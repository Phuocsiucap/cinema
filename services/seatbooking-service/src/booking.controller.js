import { redis } from './redis.js';
import db from './database.js';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const SEAT_HOLD_SECONDS = (process.env.TIME_HOLD_MINUTES || 5) * 60;

let io = null;

export function setIO(socketIO) {
    io = socketIO;
}

/**
 * Tạo booking mới
 * POST /bookings
 */
export async function createBooking(req, res) {
    const client = await db.getClient();
    
    try {
        const { showtime_id, seat_ids, promotion_code } = req.body;
        const user_id = req.headers['x-user-id'];

        if (!showtime_id || !seat_ids || !Array.isArray(seat_ids) || seat_ids.length === 0 || !user_id) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: showtime_id, seat_ids (array), user_id'
            });
        }

        // Verify all seats are locked by this user
        for (const seat_id of seat_ids) {
            const key = `seat_lock:${showtime_id}:${seat_id}`;
            const lockedBy = await redis.get(key);
            
            if (lockedBy !== user_id) {
                return res.status(400).json({
                    success: false,
                    message: `Ghế ${seat_id} chưa được giữ hoặc đã hết hạn. Vui lòng chọn lại ghế.`
                });
            }
        }

        await client.query('BEGIN');

        // Get showtime info and seat prices
        const showtimeResult = await client.query(
            'SELECT id, price FROM showtimes WHERE id = $1',
            [showtime_id]
        );

        if (showtimeResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Suất chiếu không tồn tại'
            });
        }

        const basePrice = showtimeResult.rows[0].price;

        // Get seat info for pricing
        const seatsResult = await client.query(
            'SELECT id, seat_type FROM seats WHERE id = ANY($1)',
            [seat_ids]
        );

        if (seatsResult.rows.length !== seat_ids.length) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Một số ghế không hợp lệ'
            });
        }

        // Check if any seat is already booked for this showtime
        const existingBookingsResult = await client.query(
            `SELECT sb.seat_id 
             FROM seat_bookings sb 
             JOIN bookings b ON sb.booking_id = b.id
             WHERE sb.showtime_id = $1 
             AND sb.seat_id = ANY($2)
             AND b.status IN ('CONFIRMED', 'PENDING')`,
            [showtime_id, seat_ids]
        );

        if (existingBookingsResult.rows.length > 0) {
            await client.query('ROLLBACK');
            const bookedSeats = existingBookingsResult.rows.map(r => r.seat_id);
            return res.status(409).json({
                success: false,
                message: 'Một số ghế đã được đặt',
                booked_seats: bookedSeats
            });
        }

        // Calculate total price
        let totalAmount = 0;
        const seatPrices = seatsResult.rows.map(seat => {
            let price = basePrice;
            if (seat.seat_type === 'VIP') {
                price = basePrice * 1.25; // VIP gấp 1.25 lần ghế thường
            }
            // COUPLE giữ nguyên giá vì đã được bán theo cặp
            totalAmount += price;
            return { seat_id: seat.id, seat_type: seat.seat_type, price };
        });

        // Apply promotion code if provided
        let discountAmount = 0;
        let finalAmount = totalAmount;
        let promotionToApply = null;

        if (promotion_code) {
            // Validate promotion code
            const promoQuery = `
                SELECT * FROM promotions 
                WHERE code = $1 AND is_active = true
            `;
            const promoResult = await client.query(promoQuery, [promotion_code]);

            if (promoResult.rows.length > 0) {
                const promotion = promoResult.rows[0];
                const now = new Date();

                // Validate promotion conditions
                let isValid = true;
                let errorMessage = '';

                // Check dates
                if (promotion.start_date && new Date(promotion.start_date) > now) {
                    isValid = false;
                    errorMessage = 'Mã giảm giá chưa có hiệu lực';
                } else if (promotion.end_date && new Date(promotion.end_date) < now) {
                    isValid = false;
                    errorMessage = 'Mã giảm giá đã hết hạn';
                } else if (promotion.usage_limit && promotion.used_count >= promotion.usage_limit) {
                    isValid = false;
                    errorMessage = 'Mã giảm giá đã hết lượt sử dụng';
                } else if (promotion.min_purchase && totalAmount < promotion.min_purchase) {
                    isValid = false;
                    errorMessage = `Đơn hàng tối thiểu ${promotion.min_purchase.toLocaleString('vi-VN')}đ`;
                } else if (promotion.min_tickets && seat_ids.length < promotion.min_tickets) {
                    isValid = false;
                    errorMessage = `Cần đặt tối thiểu ${promotion.min_tickets} vé`;
                }

                if (!isValid) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({
                        success: false,
                        message: errorMessage
                    });
                }

                // Calculate discount
                if (promotion.discount_type === 'PERCENTAGE') {
                    discountAmount = (totalAmount * promotion.discount_value) / 100;
                    if (promotion.max_discount) {
                        discountAmount = Math.min(discountAmount, promotion.max_discount);
                    }
                } else if (promotion.discount_type === 'FIXED') {
                    discountAmount = promotion.discount_value;
                }

                discountAmount = Math.min(discountAmount, totalAmount);
                finalAmount = totalAmount - discountAmount;
                promotionToApply = promotion;
            } else {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    message: 'Mã giảm giá không hợp lệ hoặc đã bị vô hiệu hóa'
                });
            }
        }

        // Create booking with promotion
        const bookingId = uuidv4();
        await client.query(
            `INSERT INTO bookings (
                id, user_id, showtime_id, total_amount, discount_amount, 
                final_amount, promotion_code, status, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', NOW(), NOW())`,
            [bookingId, user_id, showtime_id, totalAmount, discountAmount, finalAmount, promotion_code || null]
        );

        // Calculate discounted price per seat (proportional to original price)
        const discountRatio = discountAmount > 0 ? (finalAmount / totalAmount) : 1;
        
        // Create seat bookings with discounted prices
        for (const seat of seatPrices) {
            const seatBookingId = uuidv4();
            const discountedPrice = seat.price * discountRatio; // Áp dụng tỷ lệ giảm giá
            
            await client.query(
                `INSERT INTO seat_bookings (id, booking_id, seat_id, showtime_id, price, is_used)
                 VALUES ($1, $2, $3, $4, $5, false)`,
                [seatBookingId, bookingId, seat.seat_id, showtime_id, discountedPrice]
            );
        }

        await client.query('COMMIT');

        // Increment promotion usage count if promotion was applied
        if (promotionToApply) {
            await db.query(
                'UPDATE promotions SET used_count = used_count + 1, updated_at = NOW() WHERE code = $1',
                [promotion_code]
            );
        }

        // Emit booking created event
        if (io) {
            io.to(`showtime:${showtime_id}`).emit('booking_created', {
                booking_id: bookingId,
                showtime_id,
                seat_ids,
                user_id,
                status: 'PENDING'
            });
        }

        console.log(`✅ Booking ${bookingId} created for user ${user_id}${promotion_code ? ` with promotion ${promotion_code}` : ''}`);

        // Return updated seat prices with discount applied
        const seatsWithDiscount = seatPrices.map(seat => ({
            seat_id: seat.seat_id,
            seat_type: seat.seat_type,
            original_price: seat.price,
            price: seat.price * (discountAmount > 0 ? (finalAmount / totalAmount) : 1)
        }));

        res.status(201).json({
            success: true,
            message: 'Đặt vé thành công',
            data: {
                booking_id: bookingId,
                showtime_id,
                seats: seatsWithDiscount,
                total_amount: totalAmount,
                discount_amount: discountAmount,
                final_amount: finalAmount,
                promotion_code: promotion_code || null,
                promotion_applied: promotionToApply ? {
                    title: promotionToApply.title,
                    discount_type: promotionToApply.discount_type,
                    discount_value: promotionToApply.discount_value
                } : null,
                status: 'PENDING'
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating booking:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi tạo booking'
        });
    } finally {
        client.release();
    }
}


/**lấy danh sách booking */

/**
 * Xác nhận thanh toán và hoàn tất booking
 * POST /bookings/:bookingId/confirm
 */
export async function confirmBooking(req, res) {
    const client = await db.getClient();
    
    try {
        const { bookingId } = req.params;
        const { payment_method, transaction_reference } = req.body;
        const user_id = req.headers['x-user-id'];

        if (!bookingId || !user_id) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        await client.query('BEGIN');

        // Get booking
        const bookingResult = await client.query(
            'SELECT * FROM bookings WHERE id = $1 AND user_id = $2',
            [bookingId, user_id]
        );

        if (bookingResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy booking'
            });
        }

        const booking = bookingResult.rows[0];

        if (booking.status !== 'PENDING') {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: `Booking đang ở trạng thái ${booking.status}, không thể xác nhận`
            });
        }

        // Update booking status
        await client.query(
            `UPDATE bookings 
             SET status = 'CONFIRMED', 
                 payment_method = $1, 
                 transaction_reference = $2,
                 updated_at = NOW()
             WHERE id = $3`,
            [payment_method || null, transaction_reference || null, bookingId]
        );

        // Generate QR codes for each seat booking
        const seatBookingsResult = await client.query(
            'SELECT id, seat_id FROM seat_bookings WHERE booking_id = $1',
            [bookingId]
        );

        for (const seatBooking of seatBookingsResult.rows) {
            const qrData = `TICKET-${bookingId}-${seatBooking.seat_id}`;
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
            
            await client.query(
                'UPDATE seat_bookings SET qr_code_url = $1 WHERE id = $2',
                [qrUrl, seatBooking.id]
            );
        }

        // Remove seat locks from Redis (seats are now permanently booked)
        const showtime_id = booking.showtime_id;
        for (const seatBooking of seatBookingsResult.rows) {
            const key = `seat_lock:${showtime_id}:${seatBooking.seat_id}`;
            await redis.del(key);
        }

        await client.query('COMMIT');

        // Emit booking confirmed event - seats are now permanently booked
        if (io) {
            const seat_ids = seatBookingsResult.rows.map(sb => sb.seat_id);
            io.to(`showtime:${showtime_id}`).emit('seats_booked', {
                booking_id: bookingId,
                showtime_id,
                seat_ids,
                user_id
            });
        }

        console.log(`✅ Booking ${bookingId} confirmed`);

        res.status(200).json({
            success: true,
            message: 'Thanh toán thành công',
            data: {
                booking_id: bookingId,
                status: 'CONFIRMED'
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error confirming booking:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xác nhận booking'
        });
    } finally {
        client.release();
    }
}

/**
 * Hủy booking
 * POST /bookings/:bookingId/cancel
 */
export async function cancelBooking(req, res) {
    const client = await db.getClient();
    
    try {
        const { bookingId } = req.params;
        const user_id = req.headers['x-user-id'];

        if (!bookingId || !user_id) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        await client.query('BEGIN');

        // Get booking
        const bookingResult = await client.query(
            'SELECT * FROM bookings WHERE id = $1 AND user_id = $2',
            [bookingId, user_id]
        );

        if (bookingResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy booking'
            });
        }

        const booking = bookingResult.rows[0];

        if (booking.status === 'CANCELLED') {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Booking đã được hủy trước đó'
            });
        }

        // Get seat bookings before cancelling
        const seatBookingsResult = await client.query(
            'SELECT seat_id FROM seat_bookings WHERE booking_id = $1',
            [bookingId]
        );

        // Update booking status
        await client.query(
            `UPDATE bookings SET status = 'CANCELLED', updated_at = NOW() WHERE id = $1`,
            [bookingId]
        );

        await client.query('COMMIT');

        // Remove seat locks from Redis
        const showtime_id = booking.showtime_id;
        for (const seatBooking of seatBookingsResult.rows) {
            const key = `seat_lock:${showtime_id}:${seatBooking.seat_id}`;
            await redis.del(key);
        }

        // Emit booking cancelled event - seats are now available again
        if (io) {
            const seat_ids = seatBookingsResult.rows.map(sb => sb.seat_id);
            io.to(`showtime:${showtime_id}`).emit('booking_cancelled', {
                booking_id: bookingId,
                showtime_id,
                seat_ids,
                user_id
            });

            // Also emit seat_unlocked for each seat so UI can update
            for (const seat_id of seat_ids) {
                io.to(`showtime:${showtime_id}`).emit('seat_update', {
                    event: 'seat_unlocked',
                    showtime_id,
                    seat_id,
                    user_id
                });
            }
        }

        console.log(`✅ Booking ${bookingId} cancelled`);

        res.status(200).json({
            success: true,
            message: 'Hủy booking thành công'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error cancelling booking:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi hủy booking'
        });
    } finally {
        client.release();
    }
}

/**
 * Lấy thông tin booking
 * GET /bookings/:bookingId
 */
export async function getBooking(req, res) {
    try {
        const { bookingId } = req.params;
        const user_id = req.headers['x-user-id'];

        const bookingResult = await db.query(
            `SELECT b.*, 
                    s.start_time, s.end_time, s.price as showtime_price,
                    m.id as movie_id, m.title as movie_title, m.poster_url, m.duration_minutes,
                    r.id as room_id, r.name as room_name,
                    c.id as cinema_id, c.name as cinema_name, c.city as cinema_city,
                    p.title as promotion_title
             FROM bookings b
             JOIN showtimes s ON b.showtime_id = s.id
             JOIN movies m ON s.movie_id = m.id
             JOIN cinema_rooms r ON s.room_id = r.id
             JOIN cinemas c ON r.cinema_id = c.id
             LEFT JOIN promotions p ON b.promotion_code = p.code
             WHERE b.id = $1 AND b.user_id = $2`,
            [bookingId, user_id]
        );

        if (bookingResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'oking'
            });
        }

        const booking = bookingResult.rows[0];

        // Get seat bookings
        const seatBookingsResult = await db.query(
            `SELECT sb.*, s.row, s.number, s.seat_type
             FROM seat_bookings sb
             JOIN seats s ON sb.seat_id = s.id
             WHERE sb.booking_id = $1`,
            [bookingId]
        );

        res.status(200).json({
            success: true,
            data: {
                id: booking.id,
                user_id: booking.user_id,
                showtime_id: booking.showtime_id,
                total_amount: booking.total_amount,
                discount_amount: booking.discount_amount || 0,
                final_amount: booking.final_amount || booking.total_amount,
                promotion_code: booking.promotion_code,
                promotion_title: booking.promotion_title,
                status: booking.status,
                payment_method: booking.payment_method,
                transaction_reference: booking.transaction_reference,
                created_at: booking.created_at,
                updated_at: booking.updated_at,
                showtime: {
                    id: booking.showtime_id,
                    start_time: booking.start_time,
                    end_time: booking.end_time,
                    price: booking.showtime_price,
                    movie: {
                        id: booking.movie_id,
                        title: booking.movie_title,
                        poster_url: booking.poster_url,
                        duration_minutes: booking.duration_minutes
                    },
                    room: {
                        id: booking.room_id,
                        name: booking.room_name,
                        cinema: {
                            id: booking.cinema_id,
                            name: booking.cinema_name,
                            city: booking.cinema_city
                        }
                    }
                },
                tickets: seatBookingsResult.rows.map(sb => ({
                    id: sb.id,
                    seat_id: sb.seat_id,
                    seat_row: sb.row,
                    seat_number: sb.number,
                    seat_type: sb.seat_type,
                    price: sb.price,
                    qr_code_url: sb.qr_code_url,
                    is_used: sb.is_used
                }))
            }
        });

    } catch (error) {
        console.error('Error getting booking:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
}

/**
 * Lấy danh sách booking của user
 * GET /bookings/user
 */
export async function getUserBookings(req, res) {
    try {
        const user_id = req.headers['x-user-id'];
        const { status, limit = 20, offset = 0 } = req.query;

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'Missing user_id'
            });
        }

        let query = `
            SELECT b.*, 
                   s.start_time, s.end_time, s.price as showtime_price,
                   m.id as movie_id, m.title as movie_title, m.poster_url, m.duration_minutes,
                   r.id as room_id, r.name as room_name,
                   c.id as cinema_id, c.name as cinema_name, c.city as cinema_city,
                   p.title as promotion_title
            FROM bookings b
            JOIN showtimes s ON b.showtime_id = s.id
            JOIN movies m ON s.movie_id = m.id
            JOIN cinema_rooms r ON s.room_id = r.id
            JOIN cinemas c ON r.cinema_id = c.id
            LEFT JOIN promotions p ON b.promotion_code = p.code
            WHERE b.user_id = $1
        `;
        const params = [user_id];

        if (status) {
            query += ` AND b.status = $${params.length + 1}`;
            params.push(status);
        }

        query += ` ORDER BY b.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit), parseInt(offset));

        const bookingsResult = await db.query(query, params);

        // Get tickets for each booking
        const bookings = await Promise.all(bookingsResult.rows.map(async (booking) => {
            const ticketsResult = await db.query(
                `SELECT sb.*, s.row, s.number, s.seat_type
                 FROM seat_bookings sb
                 JOIN seats s ON sb.seat_id = s.id
                 WHERE sb.booking_id = $1`,
                [booking.id]
            );

            return {
                id: booking.id,
                user_id: booking.user_id,
                showtime_id: booking.showtime_id,
                total_amount: booking.total_amount,
                discount_amount: booking.discount_amount || 0,
                final_amount: booking.final_amount || booking.total_amount,
                promotion_code: booking.promotion_code,
                promotion_title: booking.promotion_title,
                status: booking.status,
                payment_method: booking.payment_method,
                created_at: booking.created_at,
                updated_at: booking.updated_at,
                showtime: {
                    id: booking.showtime_id,
                    start_time: booking.start_time,
                    end_time: booking.end_time,
                    price: booking.showtime_price,
                    movie: {
                        id: booking.movie_id,
                        title: booking.movie_title,
                        poster_url: booking.poster_url,
                        duration_minutes: booking.duration_minutes
                    },
                    room: {
                        id: booking.room_id,
                        name: booking.room_name,
                        cinema: {
                            id: booking.cinema_id,
                            name: booking.cinema_name,
                            city: booking.cinema_city
                        }
                    }
                },
                tickets: ticketsResult.rows.map(sb => ({
                    id: sb.id,
                    seat_id: sb.seat_id,
                    seat_row: sb.row,
                    seat_number: sb.number,
                    seat_type: sb.seat_type,
                    price: sb.price,
                    qr_code_url: sb.qr_code_url,
                    is_used: sb.is_used
                }))
            };
        }));

        res.status(200).json({
            success: true,
            data: bookings
        });

    } catch (error) {
        console.error('Error getting user bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
}

/**
 * Lấy danh sách ghế đã đặt cho một showtime
 * GET /showtimes/:showtimeId/booked-seats
 */
export async function getBookedSeats(req, res) {
    try {
        const { showtimeId } = req.params;

        const result = await db.query(
            `SELECT sb.seat_id
             FROM seat_bookings sb
             JOIN bookings b ON sb.booking_id = b.id
             WHERE sb.showtime_id = $1 
             AND b.status IN ('CONFIRMED', 'PENDING')`,
            [showtimeId]
        );

        const bookedSeatIds = result.rows.map(r => r.seat_id);

        res.status(200).json({
            success: true,
            data: {
                showtime_id: showtimeId,
                booked_seats: bookedSeatIds
            }
        });

    } catch (error) {
        console.error('Error getting booked seats:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
}

/**
 * Check-in vé (quét QR code)
 * POST /bookings/:bookingId/checkin
 * Body: { seat_booking_id?: string } - nếu có thì checkin 1 ghế, không có thì checkin tất cả
 */
export async function checkinBooking(req, res) {
    const client = await db.getClient();
    
    try {
        const { bookingId } = req.params;
        const { seat_booking_id, seat_id, qr_data } = req.body;

        if (!bookingId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu mã booking'
            });
        }

        await client.query('BEGIN');

        // Get booking info with movie and showtime details
        const bookingResult = await client.query(
            `SELECT b.id, b.user_id, b.showtime_id, b.status, 
                    b.total_amount, b.discount_amount, b.final_amount, b.promotion_code,
                    s.start_time, s.end_time,
                    m.title as movie_title,
                    r.name as room_name,
                    c.name as cinema_name,
                    u.email as customer_email,
                    u.full_name as customer_name,
                    p.title as promotion_title
             FROM bookings b
             JOIN showtimes s ON b.showtime_id = s.id
             JOIN movies m ON s.movie_id = m.id
             JOIN cinema_rooms r ON s.room_id = r.id
             JOIN cinemas c ON r.cinema_id = c.id
             LEFT JOIN users u ON b.user_id = u.id::text
             LEFT JOIN promotions p ON b.promotion_code = p.code
             WHERE b.id = $1`,
            [bookingId]
        );

        if (bookingResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy booking'
            });
        }

        const booking = bookingResult.rows[0];

        // Check booking status
        if (booking.status !== 'CONFIRMED') {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: `Vé không hợp lệ. Trạng thái: ${booking.status}`
            });
        }

        // Check if showtime has passed (with 30 min buffer after start)
        const now = new Date();
        const showtimeStart = new Date(booking.start_time);
        const showtimeEnd = new Date(booking.end_time);
        
        // Allow check-in from 15 mins before showtime to end of movie
        const checkinWindowStart = new Date(showtimeStart.getTime() - 15 * 60 * 1000);
        
        if (now < checkinWindowStart) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: `Chưa đến giờ check-in. Suất chiếu bắt đầu lúc ${showtimeStart.toLocaleTimeString('vi-VN')}`
            });
        }

        if (now > showtimeEnd) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Suất chiếu đã kết thúc'
            });
        }

        // Get seat bookings
        const seatBookingsResult = await client.query(
            `SELECT sb.*, st.row, st.number, st.seat_type
             FROM seat_bookings sb
             JOIN seats st ON sb.seat_id = st.id
             WHERE sb.booking_id = $1`,
            [bookingId]
        );

        if (seatBookingsResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin ghế'
            });
        }

        // Check if specific seat_booking is provided (ưu tiên seat_booking_id, fallback seat_id)
        let seatsToCheckin = seatBookingsResult.rows;
        const targetId = seat_booking_id || seat_id;
        
        if (targetId) {
            // Tìm theo seat_booking.id hoặc seat_id
            seatsToCheckin = seatsToCheckin.filter(sb => 
                sb.id === targetId || sb.seat_id === targetId
            );
            if (seatsToCheckin.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({
                    success: false,
                    message: 'Ghế không thuộc booking này'
                });
            }
        }

        // Check if already used
        const alreadyUsed = seatsToCheckin.filter(sb => sb.is_used);
        if (alreadyUsed.length > 0) {
            const usedSeats = alreadyUsed.map(sb => `${sb.row}${sb.number}`).join(', ');
            // Nếu checkin 1 ghế cụ thể và đã dùng
            if (targetId && alreadyUsed.length === seatsToCheckin.length) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    message: `Vé đã được sử dụng: ${usedSeats}`
                });
            }
            // Nếu checkin tất cả, chỉ cảnh báo và bỏ qua những ghế đã dùng
            seatsToCheckin = seatsToCheckin.filter(sb => !sb.is_used);
        }

        if (seatsToCheckin.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Tất cả vé đã được sử dụng'
            });
        }

        // Mark seats as used
        const seatBookingIdsToUpdate = seatsToCheckin.map(sb => sb.id);
        await client.query(
            `UPDATE seat_bookings 
             SET is_used = true, updated_at = NOW()
             WHERE id = ANY($1)`,
            [seatBookingIdsToUpdate]
        );

        await client.query('COMMIT');

        // Format seats for response
        const allSeats = seatBookingsResult.rows.map(sb => `${sb.row}${sb.number}`).join(', ');
        const checkedInSeats = seatsToCheckin.map(sb => `${sb.row}${sb.number}`).join(', ');

        res.status(200).json({
            success: true,
            message: `Check-in thành công ${seatsToCheckin.length} ghế!`,
            data: {
                booking_id: bookingId,
                movie_title: booking.movie_title,
                cinema_name: booking.cinema_name,
                room_name: booking.room_name,
                seats: allSeats,
                checked_in_seats: checkedInSeats,
                checked_in_count: seatsToCheckin.length,
                total_seats: seatBookingsResult.rows.length,
                showtime: new Date(booking.start_time).toLocaleString('vi-VN'),
                customer_name: booking.customer_name || booking.customer_email || 'Khách',
                total_amount: booking.total_amount,
                discount_amount: booking.discount_amount || 0,
                final_amount: booking.final_amount || booking.total_amount,
                promotion_code: booking.promotion_code,
                promotion_title: booking.promotion_title
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error checking in booking:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi check-in'
        });
    } finally {
        client.release();
    }
}

/**
 * Lấy danh sách bookings (cho admin) với phân trang và filter
 * GET /tickets?page=1&limit=10&status=all&movie=all&search=&date=all
 */
export async function getTickets(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const status = req.query.status || 'all';
        const movieFilter = req.query.movie || 'all';
        const search = req.query.search || '';
        const dateFilter = req.query.date || 'all';

        // Build WHERE conditions for bookings
        let conditions = ["b.status = 'CONFIRMED'"];
        let params = [];
        let paramIndex = 1;

        // Movie filter
        if (movieFilter !== 'all') {
            conditions.push(`m.id = $${paramIndex}::uuid`);
            params.push(movieFilter);
            paramIndex++;
        }

        // Search filter
        if (search) {
            conditions.push(`(
                b.id::text ILIKE $${paramIndex} OR
                m.title ILIKE $${paramIndex}
            )`);
            params.push(`%${search}%`);
            paramIndex++;
        }

        // Date filter
        if (dateFilter === 'today') {
            conditions.push('DATE(s.start_time) = CURRENT_DATE');
        } else if (dateFilter === 'yesterday') {
            conditions.push('DATE(s.start_time) = CURRENT_DATE - 1');
        } else if (dateFilter === 'week') {
            conditions.push('s.start_time >= CURRENT_DATE - INTERVAL \'7 days\'');
        } else if (dateFilter === 'month') {
            conditions.push('s.start_time >= CURRENT_DATE - INTERVAL \'30 days\'');
        }

        // Status filter - applied after grouping
        let havingClause = '';
        if (status === 'used') {
            havingClause = 'HAVING bool_and(sb.is_used) = true';
        } else if (status === 'partial') {
            havingClause = 'HAVING bool_or(sb.is_used) = true AND bool_and(sb.is_used) = false AND MAX(s.end_time) > NOW()';
        } else if (status === 'inactive') {
            havingClause = 'HAVING bool_and(sb.is_used) = false AND MAX(s.end_time) > NOW()';
        } else if (status === 'expired') {
            havingClause = 'HAVING bool_and(sb.is_used) = false AND MAX(s.end_time) <= NOW()';
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Get total count of distinct bookings
        const countQuery = `
            SELECT COUNT(*) as total FROM (
                SELECT b.id
                FROM bookings b
                JOIN showtimes s ON b.showtime_id = s.id
                JOIN movies m ON s.movie_id = m.id
                LEFT JOIN seat_bookings sb ON sb.booking_id = b.id
                ${whereClause}
                GROUP BY b.id
                ${havingClause}
            ) sub
        `;
        
        const countResult = await db.query(countQuery, params);
        const total = parseInt(countResult.rows[0].total);

        // Get bookings with all seats aggregated
        const bookingsQuery = `
            SELECT 
                b.id as booking_id,
                b.user_id,
                b.total_amount,
                b.discount_amount,
                b.final_amount,
                b.promotion_code,
                p.title as promotion_title,
                b.status as booking_status,
                b.payment_method,
                b.created_at as booking_date,
                b.updated_at,
                s.id as showtime_id,
                s.start_time,
                s.end_time,
                s.price as base_price,
                m.id as movie_id,
                m.title as movie_title,
                m.poster_url,
                m.duration_minutes,
                r.id as room_id,
                r.name as room_name,
                c.id as cinema_id,
                c.name as cinema_name,
                c.city as cinema_city,
                c.address as cinema_address,
                -- Aggregate seats info
                COUNT(sb.id) as total_seats,
                STRING_AGG(DISTINCT st.row || st.number::text, ', ' ORDER BY st.row || st.number::text) as seats,
                STRING_AGG(DISTINCT st.seat_type::text, ', ') as seat_types,
                ARRAY_AGG(
                    json_build_object(
                        'seatBookingId', sb.id,
                        'seatId', st.id,
                        'row', st.row,
                        'number', st.number,
                        'seatType', st.seat_type,
                        'price', sb.price,
                        'isUsed', sb.is_used,
                        'qrCodeUrl', sb.qr_code_url
                    )
                ) as seat_details,
                -- Status calculation
                CASE 
                    WHEN bool_and(sb.is_used) = true THEN 'used'
                    WHEN bool_or(sb.is_used) = true AND bool_and(sb.is_used) = false AND MAX(s.end_time) > NOW() THEN 'partial'
                    WHEN MAX(s.end_time) <= NOW() THEN 'expired'
                    ELSE 'inactive'
                END as ticket_status,
                -- Count used/unused
                COUNT(CASE WHEN sb.is_used = true THEN 1 END) as used_seats,
                COUNT(CASE WHEN sb.is_used = false THEN 1 END) as unused_seats
            FROM bookings b
            JOIN showtimes s ON b.showtime_id = s.id
            JOIN movies m ON s.movie_id = m.id
            JOIN cinema_rooms r ON s.room_id = r.id
            JOIN cinemas c ON r.cinema_id = c.id
            LEFT JOIN seat_bookings sb ON sb.booking_id = b.id
            LEFT JOIN seats st ON sb.seat_id = st.id
            LEFT JOIN promotions p ON b.promotion_code = p.code
            ${whereClause}
            GROUP BY b.id, s.id, m.id, r.id, c.id, p.title
            ${havingClause}
            ORDER BY b.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        params.push(limit, offset);
        const bookingsResult = await db.query(bookingsQuery, params);

        // Format bookings for response
        const bookings = bookingsResult.rows.map(row => ({
            bookingId: row.booking_id,
            userId: row.user_id,
            totalAmount: parseFloat(row.total_amount),
            discountAmount: parseFloat(row.discount_amount || 0),
            finalAmount: parseFloat(row.final_amount || row.total_amount),
            promotionCode: row.promotion_code,
            promotionTitle: row.promotion_title,
            bookingStatus: row.booking_status,
            paymentMethod: row.payment_method,
            bookingDate: row.booking_date,
            updatedAt: row.updated_at,
            // Showtime info
            showtimeId: row.showtime_id,
            showtime: new Date(row.start_time).toLocaleString('vi-VN', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            showtimeRaw: row.start_time,
            endTime: row.end_time,
            basePrice: parseFloat(row.base_price),
            // Movie info
            movieId: row.movie_id,
            movieTitle: row.movie_title,
            posterUrl: row.poster_url,
            durationMinutes: row.duration_minutes,
            // Cinema info
            cinemaId: row.cinema_id,
            cinemaName: row.cinema_name,
            cinemaCity: row.cinema_city,
            cinemaAddress: row.cinema_address,
            roomId: row.room_id,
            roomName: row.room_name,
            // Seats info
            totalSeats: parseInt(row.total_seats),
            seats: row.seats,
            seatTypes: row.seat_types,
            seatDetails: row.seat_details,
            // Status
            status: row.ticket_status,
            usedSeats: parseInt(row.used_seats),
            unusedSeats: parseInt(row.unused_seats),
        }));

        // Get list of movies for filter dropdown
        const moviesResult = await db.query(`
            SELECT DISTINCT m.id, m.title
            FROM movies m
            JOIN showtimes s ON m.id = s.movie_id
            JOIN bookings b ON b.showtime_id = s.id
            WHERE b.status = 'CONFIRMED'
            ORDER BY m.title
        `);

        res.status(200).json({
            success: true,
            data: {
                bookings,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
                movies: moviesResult.rows,
            }
        });

    } catch (error) {
        console.error('Error getting tickets:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách vé'
        });
    }
}
