from datetime import datetime
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from typing import Optional, List, Tuple
from app.models import Token, User
from app import schemas
import uuid


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def save_token(db: AsyncSession, user_id: str, token: str, expired_at: datetime):
    t = Token(
        user_id=user_id,
        token=token,
        expired_at=expired_at
    )
    
    db.add(t)
    await db.commit()
    await db.refresh(t)
    return t

async def revoke_token(db: AsyncSession, token: str):
    result = await db.execute(select(Token).filter(Token.token == token))
    t = result.scalar_one_or_none()
    if t:
        t.is_revoked = True
        await db.commit()
        await db.refresh(t)
        
async def is_token_revoked(db: AsyncSession, token: str):
    result = await db.execute(select(Token).filter(Token.token == token))
    t = result.scalar_one_or_none()
    if not t:
        return True
    return t.is_revoked

async def get_user_by_email(db: AsyncSession, email: str):
    result = await db.execute(select(User).filter(User.email == email))
    return result.scalar_one_or_none()

def verify_password(plain_password: str, hashed_password: str):
    # Truncate password to ensure it's within bcrypt limits
    truncated_password = plain_password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    return pwd_context.verify(truncated_password, hashed_password)

def hash_password(password: str) -> str:
    # Truncate password to ensure it's within bcrypt limits
    truncated_password = password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    return pwd_context.hash(truncated_password)

async def create_user(db: AsyncSession, user: schemas.AuthRegister):
    hashed_password = pwd_context.hash(user.password[:72])
    db_user = User(
        full_name=user.full_name,
        email=user.email,
        phone_number=user.phone_number,
        hashed_password=hashed_password
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

async def get_user(db: AsyncSession, user_id: str):
    result = await db.execute(select(User).filter(User.id == user_id))
    return result.scalar_one_or_none()

async def create_user_full(db: AsyncSession, user: schemas.UserCreate):
    hashed_password = pwd_context.hash(user.password)
    db_user = User(
        email=user.email,
        full_name=user.full_name,
        phone_number=user.phone_number,
        hashed_password=hashed_password,
        role=user.role if user.role else schemas.UserRole.CUSTOMER
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
) -> Tuple[List[User], int]:
    """Get users with pagination and filters"""
    query = select(User)
    count_query = select(func.count(User.id))

    # Apply filters
    if search:
        search_pattern = f"%{search}%"
        search_filter = or_(
            User.full_name.ilike(search_pattern),
            User.email.ilike(search_pattern),
            User.phone_number.ilike(search_pattern)
        )
        query = query.filter(search_filter)
        count_query = count_query.filter(search_filter)

    if role:
        query = query.filter(User.role == role)
        count_query = count_query.filter(User.role == role)

    if is_active is not None:
        query = query.filter(User.is_active == is_active)
        count_query = count_query.filter(User.is_active == is_active)

    if is_verified is not None:
        query = query.filter(User.is_verified == is_verified)
        count_query = count_query.filter(User.is_verified == is_verified)

    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Get paginated results
    query = query.order_by(User.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    users = result.scalars().all()

    return list(users), total

async def update_user(db: AsyncSession, user_id: str, user_update: schemas.UserUpdate) -> Optional[User]:
    """Update user by ID"""
    db_user = await get_user(db, user_id)
    if not db_user:
        return None

    update_data = user_update.model_dump(exclude_unset=True)

    # Handle role conversion
    if 'role' in update_data and update_data['role']:
        update_data['role'] = update_data['role']

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