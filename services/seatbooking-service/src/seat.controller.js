import { redis } from './redis.js';
import dotenv from "dotenv";
dotenv.config();

const SEAT_HOLD_SECONDS = (process.env.TIME_HOLD_MINUTES || 5) * 60;

let io = null;

export function setIO(socketIO) {
    io = socketIO;
}

export async function lockSeat(req, res) {
    try {
        const { showtime_id, seat_ids } = req.body;
        const user_id = req.headers['x-user-id'];

        if (!showtime_id || !seat_ids || !Array.isArray(seat_ids) || seat_ids.length === 0 || !user_id) {
            return res.status(400).json({ 
                success: false,
                message: 'Missing required fields: showtime_id, seat_ids (array), user_id' 
            });
        }

        const lockedSeats = [];
        const failedSeats = [];

        for (const seat_id of seat_ids) {
            const key = `seat_lock:${showtime_id}:${seat_id}`;

            // Try to lock the seat (NX = only if not exists, EX = expire in seconds)
            const result = await redis.set(key, user_id, 'NX', 'EX', SEAT_HOLD_SECONDS);

            if (result === null) {
                // Check if locked by same user
                const lockedBy = await redis.get(key);
                if (lockedBy === user_id) {
                    // Refresh TTL for same user
                    await redis.expire(key, SEAT_HOLD_SECONDS);
                    lockedSeats.push(seat_id);
                } else {
                    failedSeats.push({ seat_id, reason: 'Ghế đã được giữ bởi người khác.' });
                }
            } else {
                lockedSeats.push(seat_id);
                
                // Publish event to Redis for other instances
                const eventMessage = JSON.stringify({
                    event: 'seat_locked',
                    showtime_id,
                    seat_id,
                    user_id
                });
                await redis.publish(`seat_events:${showtime_id}`, eventMessage);
            }
        }

        if (failedSeats.length > 0 && lockedSeats.length === 0) {
            return res.status(409).json({ 
                success: false,
                message: 'Không thể giữ ghế.',
                failed_seats: failedSeats
            });
        }

        console.log(`Seats ${lockedSeats.join(', ')} for showtime ${showtime_id} locked by user ${user_id}`);
        res.status(200).json({ 
            success: true,
            message: 'Giữ ghế thành công.',
            locked_seats: lockedSeats,
            failed_seats: failedSeats
        });
    } catch (error) {
        console.error('Error locking seat:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

export async function unlockSeat(req, res) {
    try {
        const { showtime_id, seat_ids } = req.body;
        const user_id = req.headers['x-user-id'];

        if (!showtime_id || !seat_ids || !Array.isArray(seat_ids) || seat_ids.length === 0 || !user_id) {
            return res.status(400).json({ 
                success: false,
                message: 'Missing required fields: showtime_id, seat_ids (array), user_id' 
            });
        }

        const unlockedSeats = [];
        const failedSeats = [];

        for (const seat_id of seat_ids) {
            const key = `seat_lock:${showtime_id}:${seat_id}`;
            
            // Check if this user owns the lock
            const lockedBy = await redis.get(key);
            
            if (lockedBy !== user_id) {
                failedSeats.push({ seat_id, reason: 'Bạn không có quyền hủy giữ ghế này.' });
                continue;
            }

            // Delete the lock
            await redis.del(key);
            unlockedSeats.push(seat_id);

            // Publish unlock event
            const eventMessage = JSON.stringify({
                event: 'seat_unlocked',
                showtime_id,
                seat_id,
                user_id
            });
            await redis.publish(`seat_events:${showtime_id}`, eventMessage);
        }

        console.log(`Seats ${unlockedSeats.join(', ')} for showtime ${showtime_id} unlocked by user ${user_id}`);
        res.status(200).json({ 
            success: true,
            message: 'Hủy giữ ghế thành công.',
            unlocked_seats: unlockedSeats,
            failed_seats: failedSeats
        });
    } catch (error) {
        console.error('Error unlocking seat:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

