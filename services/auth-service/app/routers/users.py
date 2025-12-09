from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from app import schemas, crud, database
from app import models
import uuid

router = APIRouter()

@router.get("/", response_model=schemas.PaginatedUsersResponse)
async def list_users(
    db: AsyncSession = Depends(database.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search by name, email, or phone"),
    role: Optional[str] = Query(None, description="Filter by role: customer, admin, seller"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    is_verified: Optional[bool] = Query(None, description="Filter by verification status")
):
    """Get paginated list of users with optional filters"""
    users, total = await crud.get_users_paginated(
        db,
        skip=skip,
        limit=limit,
        search=search,
        role=role,
        is_active=is_active,
        is_verified=is_verified
    )
    return schemas.PaginatedUsersResponse(
        users=users,
        total=total,
        skip=skip,
        limit=limit
    )

@router.get("/me", response_model=schemas.UserResponse)
async def get_current_user(request: Request, db: AsyncSession = Depends(database.get_db)):
    """Get current user info from x-user-id header (set by API Gateway)"""
    user_id = request.headers.get("x-user-id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in headers")

    db_user = await crud.get_user(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.post("/", response_model=schemas.UserResponse)
async def create_user(user: schemas.UserCreate, db: AsyncSession = Depends(database.get_db)):
    db_user = await crud.get_user_by_email(db, user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return await crud.create_user_full(db=db, user=user)

@router.get("/{user_id}", response_model=schemas.UserResponse)
async def get_user(user_id: str, db: AsyncSession = Depends(database.get_db)):
    db_user = await crud.get_user(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.put("/{user_id}", response_model=schemas.UserResponse)
async def update_user(
    user_id: str,
    user_update: schemas.UserUpdate,
    db: AsyncSession = Depends(database.get_db)
):
    """Update user by ID"""
    db_user = await crud.update_user(db, user_id, user_update)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.delete("/{user_id}")
async def delete_user(user_id: str, db: AsyncSession = Depends(database.get_db)):
    """Delete user by ID"""
    success = await crud.delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

@router.post("/verify-account")
async def verify_account(request: Request, db: AsyncSession = Depends(database.get_db)):
    """Verify user account by setting is_verified = true"""
    # Get user_id from x-user-id header (set by API Gateway)
    user_id = request.headers.get("x-user-id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in headers")

    try:
        uuid.UUID(user_id)  # Validate UUID format
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    # Update user verification status
    db_user = await crud.get_user(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if db_user.is_verified:
        return {"message": "Account already verified", "is_verified": True}

    # Update is_verified to True
    update_data = {"is_verified": True}
    updated_user = await crud.update_user(db, user_id, schemas.UserUpdate(**update_data))

    if not updated_user:
        raise HTTPException(status_code=500, detail="Failed to update verification status")

    return {
        "message": "Account verified successfully",
        "is_verified": True,
        "user": {
            "id": str(updated_user.id),
            "email": updated_user.email,
            "full_name": updated_user.full_name,
            "is_verified": updated_user.is_verified
        }
    }