from fastapi import APIRouter, Depends, HTTPException, Request, Query
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
import schemas, database, crud_cinema
from models import Cinema, CinemaRoom, Seat

router = APIRouter()

@router.post("/", response_model=schemas.CinemaResponse)
async def create_cinema(cinema: schemas.CinemaCreate, db: AsyncSession = Depends(database.get_db)):
    new_cinema = await crud_cinema.create_cinema(db, cinema)
    return new_cinema

@router.post("/rooms", response_model=schemas.CinemaResponse)
async def create_cinema_room(room: schemas.AddRoomToCenema, db: AsyncSession = Depends(database.get_db)):
    updated_cinema = await crud_cinema.create_room_in_cinema(db, room)
    return updated_cinema

@router.get("/", response_model=List[schemas.CinemaResponse])
async def list_cinemas(db: AsyncSession = Depends(database.get_db)):
    cinemas = await crud_cinema.list_cinemas(db)
    return cinemas

@router.get("/{cinema_id}", response_model=schemas.CinemaResponse)
async def get_cinema(cinema_id: str, db: AsyncSession = Depends(database.get_db)):
    db_cinema = await crud_cinema.get_cinema(db, cinema_id)
    return db_cinema

@router.get("/{cinema_id}/rooms", response_model=List[schemas.CinemaRoomResponse])
async def list_cinema_rooms(cinema_id: str, db: AsyncSession = Depends(database.get_db)):
    rooms = await crud_cinema.list_cinema_rooms(db, cinema_id)
    return rooms

@router.get("/rooms/{room_id}", response_model=schemas.CinemaRoomResponse)
async def get_room(room_id: str, db: AsyncSession = Depends(database.get_db)):
    room = await crud_cinema.get_room(db, room_id)
    return room

@router.put("/{cinema_id}", response_model=schemas.CinemaResponse)
async def update_cinema(cinema_id: str, cinema: schemas.CinemaUpdate, db: AsyncSession = Depends(database.get_db)):
    updated_cinema = await crud_cinema.update_cinema(db, cinema_id, cinema)
    return updated_cinema

@router.put("/rooms/{room_id}", response_model=schemas.CinemaRoomResponse)
async def update_room(room_id: str, room: schemas.CinemaRoomUpdate, db: AsyncSession = Depends(database.get_db)):
    updated_room = await crud_cinema.update_room(db, room_id, room)
    return updated_room

@router.delete("/{cinema_id}")
async def delete_cinema(cinema_id: str, db: AsyncSession = Depends(database.get_db)):
    await crud_cinema.delete_cinema(db, cinema_id)
    return {"message": "Cinema deleted successfully"}

@router.delete("/rooms/{room_id}")
async def delete_room(room_id: str, db: AsyncSession = Depends(database.get_db)):
    await crud_cinema.delete_room(db, room_id)
    return {"message": "Room deleted successfully"}




