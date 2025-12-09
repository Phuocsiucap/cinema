from fastapi import APIRouter, HTTPException, Request, Depends, Query
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app import schemas, database, crud_showtime
from app.models import Showtime

router = APIRouter()

@router.post("/", response_model=schemas.ShowtimeResponse, status_code=201)
async def create_showtime(showtime: schemas.ShowtimeCreate, db: AsyncSession = Depends(database.get_db)):
    new_showtime = await crud_showtime.create_showtime(db, showtime)
    return new_showtime

@router.get("/movie/{movie_id}", response_model=List[schemas.ShowtimeResponse])
async def get_showtimes_by_movie(movie_id: str, db: AsyncSession = Depends(database.get_db)):
    showtimes = await crud_showtime.get_showtimes_by_movie(db, movie_id)
    return showtimes

@router.get("/room/{room_id}", response_model=List[schemas.ShowtimeResponse])
async def get_showtimes_by_room(
    room_id: str, 
    start_date: Optional[str] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Filter to date (YYYY-MM-DD)"),
    db: AsyncSession = Depends(database.get_db)
):
    showtimes = await crud_showtime.get_showtimes_by_room(db, room_id, start_date, end_date)
    return showtimes

@router.get("/{showtime_id}", response_model=schemas.ShowtimeResponse)
async def get_showtime(showtime_id: str, db: AsyncSession = Depends(database.get_db)):
    showtime = await crud_showtime.get_showtime(db, showtime_id)
    return showtime

@router.get("/{showtime_id}/seats", response_model=List[schemas.SeatWithStatusResponse])
async def get_showtime_seats(showtime_id: str, db: AsyncSession = Depends(database.get_db)):
    """Lấy danh sách ghế của showtime kèm trạng thái (available/booked)"""
    seats = await crud_showtime.get_seats_with_status(db, showtime_id)
    return seats

@router.put("/{showtime_id}", response_model=schemas.ShowtimeResponse)
async def update_showtime(showtime_id: str, data: schemas.ShowtimeUpdate, db: AsyncSession = Depends(database.get_db)):
    showtime = await crud_showtime.update_showtime(db, showtime_id, data)
    return showtime

@router.delete("/{showtime_id}")
async def delete_showtime(showtime_id: str, db: AsyncSession = Depends(database.get_db)):
    await crud_showtime.delete_showtime(db, showtime_id)
    return {"message": "Showtime deleted successfully"}

@router.get("/cinema/{cinema_id}", response_model = List[schemas.ShowtimeResponse])
async def get_showtimes_by_cinema(cinema_id: str, db: AsyncSession = Depends(database.get_db)) -> List[schemas.ShowtimeResponse]:
    showtimes = await crud_showtime.get_showtimes_by_cinema(db, cinema_id)
    return showtimes