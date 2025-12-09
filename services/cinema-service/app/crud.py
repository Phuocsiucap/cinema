from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import exc, func, select, delete
from sqlalchemy.orm import selectinload
from models import Movie, Actor, MovieActor, Cinema, CinemaRoom, Seat
from schemas import MovieBase, CastMovieCreate, PaginatedMovieResponse, MovieBasicResponse, MovieResponse, CinemaCreate, AddRoomToCenema, ActorResponse
from typing import List, Optional
from fastapi import HTTPException


# ==================== ACTOR CRUD ====================
async def search_actors(db: AsyncSession, name: str, limit: int = 10) -> List[Actor]:
    """Search actors by name"""
    result = await db.execute(
        select(Actor)
        .filter(Actor.name.ilike(f"%{name}%"))
        .limit(limit)
    )
    return result.scalars().all()


async def get_all_actors(db: AsyncSession, skip: int = 0, limit: int = 50) -> List[Actor]:
    """Get list of all actors"""
    result = await db.execute(
        select(Actor)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


async def get_actor(db: AsyncSession, actor_id: str) -> Optional[Actor]:
    """Get actor information by ID"""
    result = await db.execute(select(Actor).filter(Actor.id == actor_id))
    return result.scalar_one_or_none()


# ==================== MOVIE CRUD ====================
async def create_movie(db: AsyncSession, movie_data: MovieBase):
    # bỏ cast_members
    movie_data_dict = movie_data.dict(exclude={"cast_members"})
    movie = Movie(**movie_data_dict)
    
    db.add(movie)
    await db.commit()
    
    # Reload movie with eager load actor_associations
    result = await db.execute(
        select(Movie)
        .options(selectinload(Movie.actor_associations).selectinload(MovieActor.actor))
        .filter(Movie.id == movie.id)
    )
    return result.scalar_one()

async def add_actors_to_movie(db: AsyncSession, data: CastMovieCreate):
    result = await db.execute(select(Movie).filter(Movie.id == data.movie_id))
    movie = result.scalar_one_or_none()
    if not movie:
        raise exc.NoResultFound("Movie not found")
    
    for cast in data.cast_members:
        actor = None
        if cast.actor_id:
            result = await db.execute(select(Actor).filter(Actor.id == cast.actor_id))
            actor = result.scalar_one_or_none()
            if not actor:
                raise exc.NoResultFound(f"Actor with id {cast.actor_id} not found")
        if not actor:
            actor = Actor(
                name=cast.name,
                photo_url=cast.photo_url
            )
            db.add(actor)
            await db.flush()
    
        movie_actor = MovieActor(
            movie_id=movie.id,
            actor_id=actor.id,
            role_name=cast.role_name
        )
        db.add(movie_actor)
    await db.commit()
    
    # Reload với eager load
    result = await db.execute(
        select(Movie)
        .options(selectinload(Movie.actor_associations).selectinload(MovieActor.actor))
        .filter(Movie.id == movie.id)
    )
    return result.scalar_one()
                
            
async def get_movies(
    db: AsyncSession, 
    skip: int = 0, 
    limit: int = 20, 
    search: Optional[str] = None, 
    status: Optional[str] = None, 
    genre: Optional[str] = None
) -> PaginatedMovieResponse:
    # Chuẩn bị điều kiện lọc
    filters = []
    
    if search:
        filters.append(Movie.title.ilike(f"%{search}%"))
    
    if status:
        filters.append(Movie.status == status)
    
    if genre:
        filters.append(Movie.genre.ilike(f"%{genre}%"))
    
    # Query với window function để lấy cả data và total_count
    query = select(
        Movie,
        func.count(Movie.id).over().label('total_count')
    )
    
    if filters:
        query = query.filter(*filters)
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    results = result.all()
    
    # Extract movies và total_count
    if results:
        movies = [MovieBasicResponse.model_validate(row[0]) for row in results]
        total_count = results[0][1]
    else:
        movies = []
        total_count = 0
    
    return PaginatedMovieResponse(
        total_count=total_count,
        page=(skip // limit) + 1 if limit > 0 else 1,
        size=limit,
        items=movies
    )
    
async def get_movie(db: AsyncSession, movie_id: str) -> MovieResponse:
    result = await db.execute(
        select(Movie)
        .filter(Movie.id == movie_id)
        .options(
            selectinload(Movie.actor_associations).selectinload(MovieActor.actor)
        )
    )
    movie = result.scalar_one_or_none()
    if movie:
        return MovieResponse.model_validate(movie)
    return None


async def update_movie(db: AsyncSession, movie_id: str, movie_data: MovieBase):
    result = await db.execute(select(Movie).filter(Movie.id == movie_id))
    movie = result.scalar_one_or_none()
    if not movie:
        return None
    
    # Update movie fields
    update_data = movie_data.dict(exclude={"cast_members"}, exclude_unset=True)
    for key, value in update_data.items():
        setattr(movie, key, value)
    
    await db.commit()
    
    # Reload with actor_associations
    result = await db.execute(
        select(Movie)
        .filter(Movie.id == movie_id)
        .options(
            selectinload(Movie.actor_associations).selectinload(MovieActor.actor)
        )
    )
    return result.scalar_one()


async def update_movie_with_cast(db: AsyncSession, movie_id: str, movie_data):
    """Update movie và cast members"""
    result = await db.execute(select(Movie).filter(Movie.id == movie_id))
    movie = result.scalar_one_or_none()
    if not movie:
        return None
    
    # Update movie fields
    update_data = movie_data.dict(exclude={"cast_members"}, exclude_unset=True)
    for key, value in update_data.items():
        setattr(movie, key, value)
    
    # Update cast members if provided
    if movie_data.cast_members is not None:
        # Clear existing cast
        await db.execute(delete(MovieActor).filter(MovieActor.movie_id == movie_id))
        await db.flush()  # Changed from commit to flush
        
        # Add new cast members
        if movie_data.cast_members:
            cast_data = CastMovieCreate(
                movie_id=movie_id,
                cast_members=movie_data.cast_members
            )
            await add_actors_to_movie(db, cast_data)
    
    await db.commit()  # Single commit at the end
    
    # Reload movie with actor_associations
    result = await db.execute(
        select(Movie)
        .filter(Movie.id == movie_id)
        .options(
            selectinload(Movie.actor_associations).selectinload(MovieActor.actor)
        )
    )
    return result.scalar_one()


async def delete_movie(db: AsyncSession, movie_id: str):
    result = await db.execute(select(Movie).filter(Movie.id == movie_id))
    movie = result.scalar_one_or_none()
    if not movie:
        return False
    
    # Delete related movie_actors first
    await db.execute(delete(MovieActor).filter(MovieActor.movie_id == movie_id))
    
    await db.delete(movie)
    await db.commit()
    return True
    
    
