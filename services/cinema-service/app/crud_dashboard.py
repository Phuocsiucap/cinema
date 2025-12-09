from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models import User, Movie, Cinema, SeatBooking, Showtime, Booking, Seat
from typing import List, Optional
from app.schemas import BasicStatsResponse, RenvenueStatsResponse, TopMovieThisMonthResponse, BookingStatsResponse, DashboardResponse
from fastapi import HTTPException

async def get_dashboard_stats(db: AsyncSession) -> BasicStatsResponse:
    total_movies = await db.execute(select(func.count(Movie.id)))
    total_cinemas = await db.execute(select(func.count(Cinema.id)))
    total_users = await db.execute(select(func.count(User.id)))
    total_tickets = await db.execute(select(func.count(SeatBooking.id)))
    
    new_movies_this_month = await db.execute(
        select(func.count(Movie.id))
        .filter(func.date_part('month', Movie.created_at) == func.date_part('month', func.current_date()))
        .filter(func.date_part('year', Movie.created_at) == func.date_part('year', func.current_date()))
    )
    new_cinemas_this_month = await db.execute(
        select(func.count(Cinema.id))
        .filter(func.date_part('month', Cinema.created_at) == func.date_part('month', func.current_date()))
        .filter(func.date_part('year', Cinema.created_at) == func.date_part('year', func.current_date()))
    )
    new_users_this_month = await db.execute(
        select(func.count(User.id))
        .filter(func.date_part('month', User.created_at) == func.date_part('month', func.current_date()))
        .filter(func.date_part('year', User.created_at) == func.date_part('year', func.current_date()))
    )
    # SeatBooking không có created_at, dùng Booking.created_at thay thế
    new_tickets_this_month = await db.execute(
        select(func.count(SeatBooking.id))
        .join(Booking, SeatBooking.booking_id == Booking.id)
        .filter(func.date_part('month', Booking.created_at) == func.date_part('month', func.current_date()))
        .filter(func.date_part('year', Booking.created_at) == func.date_part('year', func.current_date()))
    )
    
    return BasicStatsResponse(
        total_movies=total_movies.scalar_one(),
        total_cinemas=total_cinemas.scalar_one(),
        total_users=total_users.scalar_one(),
        total_tickets=total_tickets.scalar_one(),
        new_movies_this_month=new_movies_this_month.scalar_one(),
        new_cinemas_this_month=new_cinemas_this_month.scalar_one(), 
        new_users_this_month=new_users_this_month.scalar_one(),
        new_tickets_this_month=new_tickets_this_month.scalar_one()
    )
    
async def get_dashboard_revenue_stats(db: AsyncSession) -> RenvenueStatsResponse:
    # SeatBooking không có created_at, JOIN với Booking
    total_revenue_month = await db.execute(
        select(func.coalesce(func.sum(SeatBooking.price), 0))
        .join(Booking, SeatBooking.booking_id == Booking.id)
        .filter(func.date_part('month', Booking.created_at) == func.date_part('month', func.current_date()))
        .filter(func.date_part('year', Booking.created_at) == func.date_part('year', func.current_date()))
    )
    total_new_tickets_now = await db.execute(
        select(func.count(SeatBooking.id))
        .join(Booking, SeatBooking.booking_id == Booking.id)
        .filter(func.date_part('day', Booking.created_at) == func.date_part('day', func.current_date()))
        .filter(func.date_part('month', Booking.created_at) == func.date_part('month', func.current_date()))
        .filter(func.date_part('year', Booking.created_at) == func.date_part('year', func.current_date()))
    )
    
    total_showtimes_now = await db.execute(
        select(func.count(Showtime.id))     
        .filter(func.date_part('day', Showtime.start_time) == func.date_part('day', func.current_date()))       
        .filter(func.date_part('month', Showtime.start_time) == func.date_part('month', func.current_date()))
        .filter(func.date_part('year', Showtime.start_time) == func.date_part('year', func.current_date()))
    )
    
    return RenvenueStatsResponse(
        total_revenue_month=total_revenue_month.scalar_one(),
        total_new_tickets_now=total_new_tickets_now.scalar_one(),
        total_showtimes_now=total_showtimes_now.scalar_one()
    )
    
async def get_top_movies_this_month(db: AsyncSession, limit: Optional[int] = 5) -> List[TopMovieThisMonthResponse]:
    from sqlalchemy import text
    
    query = text("""
        SELECT m.id, m.title, COUNT(sb.id), COALESCE(SUM(sb.price), 0), m.poster_url 
        FROM movies m 
        LEFT JOIN showtimes s ON m.id = s.movie_id 
        LEFT JOIN seat_bookings sb ON s.id = sb.showtime_id
        LEFT JOIN bookings b ON sb.booking_id = b.id
            AND date_part('month', b.created_at) = date_part('month', current_date)
            AND date_part('year', b.created_at) = date_part('year', current_date)
        GROUP BY m.id, m.title, m.poster_url
        ORDER BY COUNT(sb.id) DESC
        LIMIT :limit
    """)

    result = await db.execute(query, {"limit": limit})
    rows = result.fetchall()
    
    top_movies = [
        TopMovieThisMonthResponse(
            id=str(row[0]),
            movie_name=row[1],
            tickets_sold=row[2] or 0,
            revenue=float(row[3] or 0),
            poster_url=row[4]
        )
        for row in rows
    ]
    return top_movies
        
async def get_recent_bookings(db: AsyncSession, limit: Optional[int] = 15) -> List[BookingStatsResponse]:
    result = await db.execute(
        select(Booking, User.full_name)
        .join(User, Booking.user_id == User.id)
        .order_by(Booking.created_at.desc())
        .limit(limit)
    )
    rows = result.fetchall()
    
    recent_bookings = []
    for booking, user_name in rows:
        # JOIN SeatBooking với Seat để lấy row và number
        seat_result = await db.execute(
            select(Seat.row, Seat.number)
            .join(SeatBooking, SeatBooking.seat_id == Seat.id)
            .filter(SeatBooking.booking_id == booking.id)
        )
        seat_numbers = [f"{row}{number}" for row, number in seat_result.fetchall()]
        
        recent_bookings.append(
            BookingStatsResponse(
                id=str(booking.id),
                created_time=booking.created_at,
                total=float(booking.final_amount or booking.total_amount),
                user_name=user_name,
                name_of_steats=seat_numbers,
                status=booking.status
            )
        )
    return recent_bookings