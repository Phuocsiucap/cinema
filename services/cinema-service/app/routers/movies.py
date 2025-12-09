from fastapi import APIRouter, HTTPException, Request, Depends, Query
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from app import schemas, database, crud
from app.models import MovieActor

router = APIRouter()

@router.post("/", response_model=schemas.MovieResponse)
async def create_movie(movie: schemas.MovieCreate, db: AsyncSession = Depends(database.get_db)):
    db_movie = await crud.create_movie(db, movie)
    if movie.cast_members:
        db_movie = await crud.add_actors_to_movie(db, schemas.CastMovieCreate(
            movie_id=db_movie.id,
            cast_members=movie.cast_members
        ))
    return db_movie

@router.get("/", response_model=schemas.PaginatedMovieResponse)
async def list_movies(
    db: AsyncSession = Depends(database.get_db),
    page: int = Query(1, ge=1, description="Current page number"), 
    size: int = Query(20, ge=1, le=100, description="Number of items per page"),
    search: Optional[str] = Query(None, description="Search by movie title"),
    status: Optional[str] = Query(None, description="Filter by status: upcoming, now_showing, closed"),
    genre: Optional[str] = Query(None, description="Filter by genre"),
):
    skip = (page - 1) * size
    limit = size
    
    return await crud.get_movies(
        db, 
        skip=skip, 
        limit=limit, 
        search=search, 
        status=status, 
        genre=genre
    )
    
    
@router.get("/{movie_id}", response_model=schemas.MovieResponse)
async def get_movie(movie_id: str, db: AsyncSession = Depends(database.get_db)):
    db_movie = await crud.get_movie(db, movie_id)
    if not db_movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    return db_movie


@router.put("/{movie_id}", response_model=schemas.MovieResponse)
async def update_movie(movie_id: str, movie: schemas.MovieCreate, db: AsyncSession = Depends(database.get_db)):
    db_movie = await crud.update_movie_with_cast(db, movie_id, movie)
    if not db_movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    return await crud.get_movie(db, movie_id)


@router.delete("/{movie_id}")
async def delete_movie(movie_id: str, db: AsyncSession = Depends(database.get_db)):
    success = await crud.delete_movie(db, movie_id)
    if not success:
        raise HTTPException(status_code=404, detail="Movie not found")
    return {"message": "Movie deleted successfully"}

