from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import exc, func, select, delete
from sqlalchemy.orm import selectinload
from app.models import Movie, Cinema, CinemaRoom, Showtime, Seat, SeatBooking, Booking, BookingStatus
from app.schemas import ShowtimeBase, ShowtimeCreate, ShowtimeUpdate, ShowtimeResponse, SeatWithStatusResponse, SeatStatus
from typing import List, Optional
from fastapi import HTTPException
from datetime import timedelta, datetime, timezone

# Vietnam timezone (UTC+7)
VN_TIMEZONE = timezone(timedelta(hours=7))

def convert_to_vn_time(dt: datetime) -> datetime:
    """Convert datetime to Vietnam timezone, then remove tzinfo for naive storage"""
    if dt.tzinfo is None:
        # Naive datetime - assume it's already in VN time
        return dt
    # Convert to VN timezone, then make naive
    vn_time = dt.astimezone(VN_TIMEZONE)
    return vn_time.replace(tzinfo=None)

async def create_showtime(db: AsyncSession, data: ShowtimeCreate):
    # Kiểm tra movie tồn tại
    result = await db.execute(select(Movie).filter(Movie.id == data.movie_id))
    movie_db = result.scalar_one_or_none()
    if not movie_db:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    # Kiểm tra room tồn tại
    result = await db.execute(select(CinemaRoom).filter(CinemaRoom.id == data.room_id))
    room_db = result.scalar_one_or_none()
    if not room_db:
        raise HTTPException(status_code=404, detail="Cinema room not found")
    
    # Chuyển start_time sang giờ Việt Nam (UTC+7)
    start_time_vn = convert_to_vn_time(data.start_time)
    
    # Tính end_time
    end_time = start_time_vn + timedelta(minutes=movie_db.duration_minutes)
    
    # Tìm kiếm xung đột (cộng thêm 15 phút buffer)
    result = await db.execute(
        select(Showtime)
        .filter(
            Showtime.room_id == data.room_id,
            Showtime.end_time > (start_time_vn - timedelta(minutes=15)),
            Showtime.start_time < (end_time + timedelta(minutes=15))
        )
    )
    conflict_showtime = result.scalar_one_or_none()
    if conflict_showtime:
        raise HTTPException(status_code=400, detail="Showtime conflicts with existing showtimes in the same room")
    
    # Tạo showtime với end_time
    new_showtime = Showtime(
        movie_id=data.movie_id,
        room_id=data.room_id,
        start_time=start_time_vn,
        end_time=end_time,
        price=data.price
    )
    
    db.add(new_showtime)
    await db.commit()
    await db.refresh(new_showtime)
    
    # Load relationships để trả về response đầy đủ
    result = await db.execute(
        select(Showtime)
        .filter(Showtime.id == new_showtime.id)
        .options(
            selectinload(Showtime.movie),
            selectinload(Showtime.room).selectinload(CinemaRoom.cinema)
        )
    )
    return result.scalar_one()

async def get_showtime(db: AsyncSession, showtime_id: str) -> Optional[Showtime]:
    result = await db.execute(
        select(Showtime)
        .filter(Showtime.id == showtime_id)
        .options(
            selectinload(Showtime.movie),
            selectinload(Showtime.room).selectinload(CinemaRoom.cinema)
        )
    )
    showtime = result.scalar_one_or_none()
    if not showtime:
        raise HTTPException(status_code=404, detail="Showtime not found")
    return showtime

async def get_showtimes_by_movie(db: AsyncSession, movie_id: str) -> List[Showtime]:
    result = await db.execute(
        select(Showtime)
        .filter(Showtime.movie_id == movie_id)
        .options(
            selectinload(Showtime.movie),
            selectinload(Showtime.room).selectinload(CinemaRoom.cinema)
        )
        .order_by(Showtime.start_time)
    )
    return result.scalars().all()

async def get_upcoming_showtimes_by_movie(db: AsyncSession, movie_id: str) -> List[Showtime]:
    """Get showtimes for a movie in the next month from now"""
    now = datetime.now(VN_TIMEZONE).replace(tzinfo=None)
    one_month_later = now + timedelta(days=30)
    
    result = await db.execute(
        select(Showtime)
        .filter(
            Showtime.movie_id == movie_id,
            Showtime.start_time >= now,
            Showtime.start_time <= one_month_later
        )
        .options(
            selectinload(Showtime.movie),
            selectinload(Showtime.room).selectinload(CinemaRoom.cinema)
        )
        .order_by(Showtime.start_time)
    )
    return result.scalars().all()

async def get_showtimes_by_room(db: AsyncSession, room_id: str, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Showtime]:
    query = select(Showtime).filter(Showtime.room_id == room_id)
    
    if start_date:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        query = query.filter(Showtime.start_time >= start_dt)
    if end_date:
        end_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)  # Include the whole end day
        query = query.filter(Showtime.start_time < end_dt)
    
    result = await db.execute(
        query.options(
            selectinload(Showtime.movie),
            selectinload(Showtime.room).selectinload(CinemaRoom.cinema)
        )
        .order_by(Showtime.start_time)
    )
    return result.scalars().all()

async def update_showtime(db: AsyncSession, showtime_id: str, data: ShowtimeUpdate) -> Showtime:
    result = await db.execute(select(Showtime).filter(Showtime.id == showtime_id))
    showtime = result.scalar_one_or_none()
    if not showtime:
        raise HTTPException(status_code=404, detail="Showtime not found")
    
    update_data = data.model_dump(exclude_unset=True)
    
    # Nếu thay đổi start_time hoặc movie, cần tính lại end_time
    if 'start_time' in update_data or 'movie_id' in update_data:
        movie_id = update_data.get('movie_id', showtime.movie_id)
        result = await db.execute(select(Movie).filter(Movie.id == movie_id))
        movie = result.scalar_one_or_none()
        if not movie:
            raise HTTPException(status_code=404, detail="Movie not found")
        
        start_time = update_data.get('start_time', showtime.start_time)
        update_data['end_time'] = start_time + timedelta(minutes=movie.duration_minutes)
    
    for key, value in update_data.items():
        setattr(showtime, key, value)
    
    await db.commit()
    
    # Reload với relationships
    result = await db.execute(
        select(Showtime)
        .filter(Showtime.id == showtime_id)
        .options(
            selectinload(Showtime.movie),
            selectinload(Showtime.room).selectinload(CinemaRoom.cinema)
        )
    )
    return result.scalar_one()

async def delete_showtime(db: AsyncSession, showtime_id: str) -> bool:
    result = await db.execute(select(Showtime).filter(Showtime.id == showtime_id))
    showtime = result.scalar_one_or_none()
    if not showtime:
        raise HTTPException(status_code=404, detail="Showtime not found")
    
    await db.delete(showtime)
    await db.commit()
    return True


async def get_seats_with_status(db: AsyncSession, showtime_id: str) -> List[SeatWithStatusResponse]:
    """Lấy danh sách ghế của showtime kèm trạng thái đã đặt"""
    
    # Kiểm tra showtime tồn tại và lấy room_id
    result = await db.execute(
        select(Showtime)
        .filter(Showtime.id == showtime_id)
        .options(selectinload(Showtime.room).selectinload(CinemaRoom.seats))
    )
    showtime = result.scalar_one_or_none()
    if not showtime:
        raise HTTPException(status_code=404, detail="Showtime not found")
    
    # Lấy danh sách seat_id đã được đặt (booking confirmed hoặc pending)
    booked_result = await db.execute(
        select(SeatBooking.seat_id)
        .join(Booking, SeatBooking.booking_id == Booking.id)
        .filter(
            SeatBooking.showtime_id == showtime_id,
            Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.PENDING])
        )
    )
    booked_seat_ids = set(row[0] for row in booked_result.fetchall())
    
    # Map ghế với trạng thái
    seats_with_status = []
    for seat in showtime.room.seats:
        status = SeatStatus.BOOKED if seat.id in booked_seat_ids else SeatStatus.AVAILABLE
        seats_with_status.append(SeatWithStatusResponse(
            id=seat.id,
            room_id=seat.room_id,
            row=seat.row,
            number=seat.number,
            seat_type=seat.seat_type,
            is_active=seat.is_active,
            status=status
        ))
    
    return seats_with_status

async def get_showtimes_by_cinema(db: AsyncSession, cinema_id: str) -> List[ShowtimeResponse]:
    result = await db.execute(
        select(Showtime)
        .join(CinemaRoom, Showtime.room_id == CinemaRoom.id)
        .join(Cinema, CinemaRoom.cinema_id == Cinema.id)
        .filter(Cinema.id == cinema_id)
        .options(
            selectinload(Showtime.movie),
            selectinload(Showtime.room).selectinload(CinemaRoom.cinema)
        )
    )
    return result.scalars().all()

async def get_upcoming_showtimes_by_cinema(db: AsyncSession, cinema_id: str) -> List[ShowtimeResponse]:
    """Get showtimes for a cinema in the next month from now"""
    now = datetime.now(VN_TIMEZONE).replace(tzinfo=None)
    one_month_later = now + timedelta(days=30)
    
    result = await db.execute(
        select(Showtime)
        .join(CinemaRoom, Showtime.room_id == CinemaRoom.id)
        .join(Cinema, CinemaRoom.cinema_id == Cinema.id)
        .filter(
            Cinema.id == cinema_id,
            Showtime.start_time >= now,
            Showtime.start_time <= one_month_later
        )
        .options(
            selectinload(Showtime.movie),
            selectinload(Showtime.room).selectinload(CinemaRoom.cinema)
        )
        .order_by(Showtime.start_time)
    )
    return result.scalars().all()