from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import exc, func, select, delete
from sqlalchemy.orm import selectinload
from app.models import Movie, Actor, MovieActor, Cinema, CinemaRoom, Seat, SeatBooking
from app.schemas import MovieBase, CastMovieCreate, PaginatedMovieResponse, MovieBasicResponse, MovieResponse, CinemaCreate, AddRoomToCenema, CinemaUpdate, CinemaRoomUpdate, SeatUpdate
from typing import List, Optional
from fastapi import HTTPException


    
#==========================cinema related functions==========================
    
async def create_cinema(db: AsyncSession, data: CinemaCreate):
    new_cinema = Cinema(**data.dict())
    db.add(new_cinema)
    await db.commit()
    # Refresh and eager load rooms
    result = await db.execute(
        select(Cinema)
        .filter(Cinema.id == new_cinema.id)
        .options(selectinload(Cinema.rooms))
    )
    return result.scalar_one()
        
async def create_room_in_cinema(db: AsyncSession, room_data: AddRoomToCenema):
    result = await db.execute(select(Cinema).filter(Cinema.id == room_data.cinema_id))
    cinema = result.scalar_one_or_none()
    if not cinema:
        raise HTTPException(status_code=404, detail="Cinema not found")

    for room in room_data.rooms:
        # 1) Tạo phòng
        new_room = CinemaRoom(
            cinema_id=cinema.id,
            name=room.name,
            seat_count=len(room.seats)
        )
        db.add(new_room)
        await db.flush()  # Lấy new_room.id ngay lập tức

        # 2) Tạo danh sách ghế
        for seat in room.seats:
            new_seat = Seat(
                room_id=new_room.id,
                row=seat.row,
                number=seat.number,
                seat_type=seat.seat_type,
                is_active=seat.is_active if hasattr(seat, 'is_active') else True
            )
            db.add(new_seat)

        # 3) Cập nhật total_rooms của cinema
        cinema.total_rooms += 1

    await db.commit()
    # Reload cinema with rooms and seats
    result = await db.execute(
        select(Cinema)
        .filter(Cinema.id == cinema.id)
        .options(
            selectinload(Cinema.rooms).selectinload(CinemaRoom.seats)
        )
    )
    return result.scalar_one()


async def list_cinemas(db: AsyncSession) -> List[Cinema]:
    result = await db.execute(
        select(Cinema).options(
            selectinload(Cinema.rooms).selectinload(CinemaRoom.seats)
        )
    )
    cinemas = result.scalars().all()
    return cinemas

async def get_cinema(db: AsyncSession, cinema_id: str) -> Optional[Cinema]:
    result = await db.execute(
        select(Cinema)
        .filter(Cinema.id == cinema_id)
        .options(
            selectinload(Cinema.rooms).selectinload(CinemaRoom.seats)
        )
    )
    cinema = result.scalar_one_or_none()
    if not cinema:
        raise HTTPException(status_code=404, detail="Cinema not found")
    return cinema

async def list_cinema_rooms(db: AsyncSession, cinema_id: str) -> List[CinemaRoom]:
    result = await db.execute(
        select(CinemaRoom)
        .filter(CinemaRoom.cinema_id == cinema_id)
        .options(selectinload(CinemaRoom.seats))
    )
    rooms = result.scalars().all()
    return rooms


async def get_room(db: AsyncSession, room_id: str) -> Optional[CinemaRoom]:
    result = await db.execute(
        select(CinemaRoom)
        .filter(CinemaRoom.id == room_id)
        .options(selectinload(CinemaRoom.seats))
    )
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room


async def update_cinema(db: AsyncSession, cinema_id: str, data: CinemaUpdate) -> Cinema:
    result = await db.execute(
        select(Cinema)
        .filter(Cinema.id == cinema_id)
        .options(selectinload(Cinema.rooms).selectinload(CinemaRoom.seats))
    )
    cinema = result.scalar_one_or_none()
    if not cinema:
        raise HTTPException(status_code=404, detail="Cinema not found")
    
    # Update only provided fields
    update_data = data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(cinema, field, value)
    
    await db.commit()
    await db.refresh(cinema)
    
    # Reload with relationships
    result = await db.execute(
        select(Cinema)
        .filter(Cinema.id == cinema_id)
        .options(selectinload(Cinema.rooms).selectinload(CinemaRoom.seats))
    )
    return result.scalar_one()


async def update_room(db: AsyncSession, room_id: str, data: CinemaRoomUpdate) -> CinemaRoom:
    result = await db.execute(
        select(CinemaRoom)
        .filter(CinemaRoom.id == room_id)
        .options(selectinload(CinemaRoom.seats))
    )
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Update room name if provided
    if data.name is not None:
        room.name = data.name
    
    # Update seats if provided
    if data.seats is not None:
        # Safer update: don't delete seats that have existing bookings
        # Fetch existing seats for the room
        existing_result = await db.execute(select(Seat).where(Seat.room_id == room_id))
        existing_seats = { (s.row, s.number): s for s in existing_result.scalars().all() }

        # Track seats that should remain (by (row,number))
        incoming_keys = set()

        for seat_data in data.seats:
            key = (seat_data.row, seat_data.number)
            incoming_keys.add(key)
            if key in existing_seats:
                # Update existing seat properties
                s = existing_seats[key]
                s.seat_type = seat_data.seat_type
                s.is_active = seat_data.is_active if seat_data.is_active is not None else True
            else:
                # Create new seat
                new_seat = Seat(
                    room_id=room_id,
                    row=seat_data.row,
                    number=seat_data.number,
                    seat_type=seat_data.seat_type,
                    is_active=seat_data.is_active if seat_data.is_active is not None else True
                )
                db.add(new_seat)

        # Determine existing seats that are not in incoming list -> candidate for deletion
        to_delete = []
        for (r, n), seat_obj in existing_seats.items():
            if (r, n) not in incoming_keys:
                # Check if seat has any bookings
                booking_check = await db.execute(
                    select(func.count()).select_from(SeatBooking).where(SeatBooking.seat_id == seat_obj.id)
                )
                booking_count = booking_check.scalar_one()
                if booking_count == 0:
                    to_delete.append(seat_obj.id)
                else:
                    # Can't delete seat with bookings: mark inactive so it won't be used for new showtimes
                    seat_obj.is_active = False

        # Delete seats that have no bookings
        if to_delete:
            await db.execute(delete(Seat).where(Seat.id.in_(to_delete)))

        # Update seat_count to reflect current seats in DB for the room
        count_result = await db.execute(select(func.count()).select_from(Seat).where(Seat.room_id == room_id))
        room.seat_count = int(count_result.scalar_one())
    
    await db.commit()
    
    # Reload with seats
    result = await db.execute(
        select(CinemaRoom)
        .filter(CinemaRoom.id == room_id)
        .options(selectinload(CinemaRoom.seats))
    )
    return result.scalar_one()


async def delete_cinema(db: AsyncSession, cinema_id: str) -> bool:
    result = await db.execute(select(Cinema).filter(Cinema.id == cinema_id))
    cinema = result.scalar_one_or_none()
    if not cinema:
        raise HTTPException(status_code=404, detail="Cinema not found")
    
    await db.delete(cinema)
    await db.commit()
    return True


async def delete_room(db: AsyncSession, room_id: str) -> bool:
    result = await db.execute(
        select(CinemaRoom)
        .filter(CinemaRoom.id == room_id)
    )
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Update cinema total_rooms
    cinema_result = await db.execute(select(Cinema).filter(Cinema.id == room.cinema_id))
    cinema = cinema_result.scalar_one_or_none()
    if cinema:
        cinema.total_rooms = max(0, cinema.total_rooms - 1)
    
    await db.delete(room)
    await db.commit()
    return True