import { redis } from "./redis.js";

export function setupSocketIO(io) {
    // Create duplicate connections for pub/sub
    const subscriber = redis.duplicate();
    const expirySubscriber = redis.duplicate();

    // Subscribe to seat events (manual publish from lock/unlock)
    subscriber.psubscribe("seat_events:*", (err, count) => {
        if (err) {
            console.error("Failed to subscribe to seat_events:", err);
        } else {
            console.log(`✅ Subscribed to seat_events pattern (${count} channels)`);
        }
    });

    // Subscribe to key expiration events (requires notify-keyspace-events = Ex on Redis)
    // For Upstash: Enable "Eviction Notifications" in dashboard
    expirySubscriber.psubscribe("__keyevent@0__:expired", (err, count) => {
        if (err) {
            console.error("Failed to subscribe to expiry events:", err);
        } else {
            console.log(`✅ Subscribed to key expiration events (${count} channels)`);
        }
    });

    // Listen for seat lock/unlock messages
    subscriber.on("pmessage", (pattern, channel, message) => {
        console.log(`📩 Received message on channel: ${channel}`);
        console.log(`📩 Message content: ${message}`);
        
        const showtime_id = channel.split(":")[1];
        try {
            const data = JSON.parse(message);
            
            // Check how many clients are in the room
            const room = io.sockets.adapter.rooms.get(showtime_id);
            const clientCount = room ? room.size : 0;
            console.log(`📤 Emitting to room ${showtime_id} (${clientCount} clients)`);
            
            io.to(showtime_id).emit("seat_update", data);
            console.log(`✅ Emitted seat_update to room ${showtime_id}:`, data);
        } catch (e) {
            console.error("❌ Error parsing message:", e);
        }
    });

    // Listen for key expiration (auto-unlock when hold time expires)
    expirySubscriber.on("pmessage", (pattern, channel, expiredKey) => {
        console.log(`Key expired: ${expiredKey}`);
        
        // expiredKey format: "seat_lock:showtime_id:seat_id"
        if (expiredKey.startsWith("seat_lock:")) {
            const parts = expiredKey.split(":");
            const showtime_id = parts[1];
            const seat_id = parts[2];

            const data = {
                event: "seat_expired",
                showtime_id,
                seat_id,
                message: "Ghế đã hết thời gian giữ"
            };

            io.to(showtime_id).emit("seat_update", data);
            console.log(`Seat ${seat_id} expired for showtime ${showtime_id}`);
        }
    });

    // Handle client connections
    io.on("connection", (socket) => {
        console.log(`Client connected: ${socket.id}`);

        // Join showtime room and send current locked seats
        socket.on("join_showtime", async (showtime_id) => {
            socket.join(showtime_id);
            console.log(`Socket ${socket.id} joined room: ${showtime_id}`);
            
            // Send current locked seats status to the new client
            try {
                const pattern = `seat_lock:${showtime_id}:*`;
                const keys = await redis.keys(pattern);
                
                const lockedSeats = [];
                for (const key of keys) {
                    const seat_id = key.split(':')[2];
                    const user_id = await redis.get(key);
                    const ttl = await redis.ttl(key);
                    
                    if (ttl > 0) {
                        lockedSeats.push({ seat_id, user_id, ttl });
                    }
                }
                
                // Send initial state to client
                socket.emit("seat_status", {
                    showtime_id,
                    locked_seats: lockedSeats
                });
            } catch (err) {
                console.error("Error getting initial seat status:", err);
            }
        });

        // Leave showtime room
        socket.on("leave_showtime", (showtime_id) => {
            socket.leave(showtime_id);
            console.log(`Socket ${socket.id} left room: ${showtime_id}`);
        });

        socket.on("disconnect", () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });

    console.log("Socket.IO setup completed - listening for Redis key expiration events");
}