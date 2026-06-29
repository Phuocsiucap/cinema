from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app import crud, database, schemas

router = APIRouter()


@router.post("/", response_model=schemas.TypeResponse, status_code=201)
async def create_type(type_data: schemas.TypeCreate, db: AsyncSession = Depends(database.get_db)):
    existing_type = await crud.get_type_by_name(db, type_data.name)
    if existing_type:
        raise HTTPException(status_code=400, detail="Type name already exists")

    return await crud.create_type(db, type_data)


@router.get("/", response_model=schemas.PaginatedTypesResponse)
async def list_types(
    db: AsyncSession = Depends(database.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search by type name or description"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
):
    types, total = await crud.get_types_paginated(
        db,
        skip=skip,
        limit=limit,
        search=search,
        is_active=is_active,
    )

    return schemas.PaginatedTypesResponse(
        types=types,
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/{type_id}", response_model=schemas.TypeResponse)
async def get_type(type_id: int, db: AsyncSession = Depends(database.get_db)):
    db_type = await crud.get_type(db, type_id)
    if not db_type:
        raise HTTPException(status_code=404, detail="Type not found")
    return db_type


@router.put("/{type_id}", response_model=schemas.TypeResponse)
async def update_type(
    type_id: int,
    type_update: schemas.TypeUpdate,
    db: AsyncSession = Depends(database.get_db),
):
    if type_update.name:
        existing_type = await crud.get_type_by_name(db, type_update.name)
        if existing_type and existing_type.id != type_id:
            raise HTTPException(status_code=400, detail="Type name already exists")

    updated_type = await crud.update_type(db, type_id, type_update)
    if not updated_type:
        raise HTTPException(status_code=404, detail="Type not found")

    return updated_type


@router.delete("/{type_id}")
async def delete_type(type_id: int, db: AsyncSession = Depends(database.get_db)):
    success = await crud.delete_type(db, type_id)
    if not success:
        raise HTTPException(status_code=404, detail="Type not found")

    return {"message": "Type deleted successfully"}
