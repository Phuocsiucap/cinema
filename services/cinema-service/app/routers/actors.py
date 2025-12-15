from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from app import schemas, database, crud

router = APIRouter()


@router.get("/", response_model=List[schemas.ActorResponse])
async def list_actors(
    db: AsyncSession = Depends(database.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """Get list of all actors"""
    actors = await crud.get_all_actors(db, skip=skip, limit=limit)
    return actors


@router.get("/search", response_model=List[schemas.ActorResponse])
async def search_actors(
    db: AsyncSession = Depends(database.get_db),
    name: str = Query(..., min_length=1, description="Actor name to search"),
    limit: int = Query(10, ge=1, le=50),
):
    """Search actors by name"""
    actors = await crud.search_actors(db, name=name, limit=limit)
    return actors


@router.get("/{actor_id}", response_model=schemas.ActorResponse)
async def get_actor(actor_id: str, db: AsyncSession = Depends(database.get_db)):
    """Get actor information by ID"""
    actor = await crud.get_actor(db, actor_id)
    if not actor:
        raise HTTPException(status_code=404, detail="Actor not found")
    return actor
