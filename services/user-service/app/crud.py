from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from typing import Optional, List, Tuple
import models, schemas
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def get_user(db: AsyncSession, user_id: str):
    result = await db.execute(select(models.User).filter(models.User.id == user_id))
    return result.scalar_one_or_none()

async def get_user_by_email(db: AsyncSession, email: str):
    result = await db.execute(select(models.User).filter(models.User.email == email))
    return result.scalar_one_or_none()

async def create_user(db: AsyncSession, user: schemas.UserCreate):
    hashed_password = pwd_context.hash(user.password)
    db_user = models.User(
        email=user.email,
        full_name=user.full_name,
        phone_number=user.phone_number,
        hashed_password=hashed_password,
        role=models.UserRole(user.role.value) if user.role else models.UserRole.CUSTOMER
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

async def get_users_paginated(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 10,
    search: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    is_verified: Optional[bool] = None
) -> Tuple[List[models.User], int]:
    """Get users with pagination and filters"""
    query = select(models.User)
    count_query = select(func.count(models.User.id))
    
    # Apply filters
    if search:
        search_pattern = f"%{search}%"
        search_filter = or_(
            models.User.full_name.ilike(search_pattern),
            models.User.email.ilike(search_pattern),
            models.User.phone_number.ilike(search_pattern)
        )
        query = query.filter(search_filter)
        count_query = count_query.filter(search_filter)
    
    if role:
        query = query.filter(models.User.role == models.UserRole(role))
        count_query = count_query.filter(models.User.role == models.UserRole(role))
    
    if is_active is not None:
        query = query.filter(models.User.is_active == is_active)
        count_query = count_query.filter(models.User.is_active == is_active)
    
    if is_verified is not None:
        query = query.filter(models.User.is_verified == is_verified)
        count_query = count_query.filter(models.User.is_verified == is_verified)
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Get paginated results
    query = query.order_by(models.User.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    users = result.scalars().all()
    
    return list(users), total

async def update_user(db: AsyncSession, user_id: str, user_update: schemas.UserUpdate) -> Optional[models.User]:
    """Update user by ID"""
    db_user = await get_user(db, user_id)
    if not db_user:
        return None
    
    update_data = user_update.model_dump(exclude_unset=True)
    
    # Convert role string to enum if present
    if 'role' in update_data and update_data['role']:
        update_data['role'] = models.UserRole(update_data['role'].value)
    
    for field, value in update_data.items():
        setattr(db_user, field, value)
    
    await db.commit()
    await db.refresh(db_user)
    return db_user

async def delete_user(db: AsyncSession, user_id: str) -> bool:
    """Delete user by ID"""
    db_user = await get_user(db, user_id)
    if not db_user:
        return False
    
    await db.delete(db_user)
    await db.commit()
    return True