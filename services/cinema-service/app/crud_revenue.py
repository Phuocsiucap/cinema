from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, text
from app.models import Movie, SeatBooking, Booking, Showtime, Cinema, CinemaRoom, Seat
from typing import List, Optional
from datetime import datetime, timedelta
from app.schemas import (
    ComparisonItem,
    RevenueComparisonResponse,
    RevenueComparisonRequest,
    CinemaEntityInfo,
    RoomEntityInfo,
    MovieEntityInfo
)


async def calculate_occupancy_rate(db: AsyncSession, comparison_type: str, row, start_date, end_date):
    """Tính % lấp đầy cho entity"""
    if comparison_type == 'cinema':
        # Query tổng seats và tickets sold cho cinema
        pass
    elif comparison_type == 'room':
        # Query cho room cụ thể
        pass
    elif comparison_type == 'movie':
        # Query cho movie cụ thể
        pass
    return 0.0

async def get_entity_info(db: AsyncSession, comparison_type: str, row):
    """Lấy thông tin bổ sung cho entity"""
    if comparison_type == 'cinema':
        return CinemaEntityInfo(city=row.city, total_rooms=row.total_rooms)
    elif comparison_type == 'room':
        return RoomEntityInfo(cinema_name=row.cinema_name, seat_capacity=row.seat_count)
    elif comparison_type == 'movie':
        return MovieEntityInfo(genre=row.genre, rating=row.rating or "Not Rated")

async def get_revenue_comparison(db: AsyncSession, params: RevenueComparisonRequest) -> RevenueComparisonResponse:
    """Lấy dữ liệu so sánh doanh thu giữa các thực thể (phim, rạp, phòng chiếu)"""
    
    end_date = params.end_date or datetime.utcnow()
    start_date = params.start_date or (end_date - timedelta(days=30))
    period_type = params.period_type or 'month'
    
    base_query = select(
        func.sum(SeatBooking.price).label('revenue'),
        func.count(SeatBooking.id).label('tickets_sold'),
        func.count(func.distinct(Showtime.id)).label('shows_count'),
        func.avg(SeatBooking.price).label('avg_ticket_price')
    ).select_from(
        SeatBooking
    ).join(
        Booking, SeatBooking.booking_id == Booking.id
    ).join(
        Showtime, SeatBooking.showtime_id == Showtime.id
    ).where(
        and_(
            Booking.status == 'CONFIRMED',
            Booking.created_at.between(start_date, end_date)
        )
    )
    
    #dynamic joins và group by dựa trên comparison_type
    if params.comparison_type == 'cinema':
        query = (select(
                Cinema.id,
                Cinema.name,
                Cinema.city,
                func.count(func.distinct(CinemaRoom.id)).label('total_rooms'),
                func.coalesce(func.sum(SeatBooking.price), 0).label('revenue'),
                func.count(SeatBooking.id).label('tickets_sold'),
                func.count(func.distinct(Showtime.id)).label('shows_count'),
                func.coalesce(func.avg(SeatBooking.price), 0).label('avg_ticket_price')
            ).select_from(Cinema)
                .join(CinemaRoom, Cinema.id == CinemaRoom.cinema_id)
                .outerjoin(Showtime, CinemaRoom.id == Showtime.room_id)
                .outerjoin(SeatBooking, and_(
                    Showtime.id == SeatBooking.showtime_id,
                    SeatBooking.booking_id.in_(
                        select(Booking.id).where(and_(
                            Booking.status == 'CONFIRMED',
                            Booking.created_at.between(start_date, end_date)
                        ))
                    )
                ))
                .group_by(Cinema.id, Cinema.name, Cinema.city)
                .order_by(text("revenue DESC"))
                .limit(params.limit))
    elif params.comparison_type == 'room':
        query = (select(
                CinemaRoom.id,
                CinemaRoom.name,
                Cinema.name.label('cinema_name'),
                CinemaRoom.seat_count,
                func.coalesce(func.sum(SeatBooking.price), 0).label('revenue'),
                func.count(SeatBooking.id).label('tickets_sold'),
                func.count(func.distinct(Showtime.id)).label('shows_count'),
                func.coalesce(func.avg(SeatBooking.price), 0).label('avg_ticket_price')
            ).select_from(CinemaRoom)
                .join(Cinema, CinemaRoom.cinema_id == Cinema.id)
                .outerjoin(Showtime, CinemaRoom.id == Showtime.room_id)
                .outerjoin(SeatBooking, and_(
                    Showtime.id == SeatBooking.showtime_id,
                    SeatBooking.booking_id.in_(
                        select(Booking.id).where(and_(
                            Booking.status == 'CONFIRMED',
                            Booking.created_at.between(start_date, end_date)
                        ))
                    )
                ))
                .group_by(CinemaRoom.id, CinemaRoom.name, Cinema.name, CinemaRoom.seat_count)
                .order_by(text("revenue DESC"))
                .limit(params.limit))
    elif params.comparison_type == 'movie':
        query = (select(
                Movie.id,
                Movie.title,
                Movie.genre,
                Movie.rating,
                func.coalesce(func.sum(SeatBooking.price), 0).label('revenue'),
                func.count(SeatBooking.id).label('tickets_sold'),
                func.count(func.distinct(Showtime.id)).label('shows_count'),
                func.coalesce(func.avg(SeatBooking.price), 0).label('avg_ticket_price')
            ).select_from(Movie)
                .outerjoin(Showtime, Movie.id == Showtime.movie_id)
                .outerjoin(SeatBooking, and_(
                    Showtime.id == SeatBooking.showtime_id,
                    SeatBooking.booking_id.in_(
                        select(Booking.id).where(and_(
                            Booking.status == 'CONFIRMED',
                            Booking.created_at.between(start_date, end_date)
                        ))
                    )
                ))
                .group_by(Movie.id, Movie.title, Movie.genre, Movie.rating)
                .order_by(text("revenue DESC"))
                .limit(params.limit))
    else:
        query = base_query.limit(params.limit)
    
    result = await db.execute(query)
    rows = result.all()
    
    comparison_data = []
    max_revenue = max(row.revenue or 0 for row in rows) if rows else 0
    
    for row in rows:
        occupancy_rate = await calculate_occupancy_rate(db, params.comparison_type, row, start_date, end_date)
        
        entity_info = await get_entity_info(db, params.comparison_type, row)
        comparison_data.append(ComparisonItem(
            entity_id=str(row[0]),  # ID từ group by đầu tiên
            entity_name=row[1],      # Name từ group by thứ hai
            entity_info=entity_info,
            revenue=float(row.revenue or 0),
            tickets_sold=int(row.tickets_sold or 0),
            avg_ticket_price=float(row.avg_ticket_price or 0),
            occupancy_rate=occupancy_rate,
            shows_count=int(row.shows_count or 0),
            percentage=(row.revenue / max_revenue * 100) if max_revenue > 0 else 0
        ))
    
    # Count total entities
    total_entities = len(rows)
    
    return RevenueComparisonResponse(
        comparison_type=params.comparison_type,
        period_type=period_type,
        start_date=start_date.date() if isinstance(start_date, datetime) else start_date,
        end_date=end_date.date() if isinstance(end_date, datetime) else end_date,
        total_entities=total_entities,
        data=comparison_data
    )