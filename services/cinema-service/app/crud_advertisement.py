from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, and_
from typing import List, Optional
from app import models, schemas


# ================== BANNER CRUD ==================

async def create_banner(db: AsyncSession, banner: schemas.BannerCreate) -> models.Banner:
    """Create a new banner advertisement"""
    db_banner = models.Banner(**banner.model_dump())
    db.add(db_banner)
    await db.commit()
    await db.refresh(db_banner)
    return db_banner


async def get_banners(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    active_only: bool = False
) -> List[models.Banner]:
    """Get all banners with optional filtering"""
    query = select(models.Banner).order_by(models.Banner.display_order, models.Banner.created_at.desc())
    
    if active_only:
        query = query.where(models.Banner.is_active == True)
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


async def get_banner(db: AsyncSession, banner_id: str) -> Optional[models.Banner]:
    """Get a single banner by ID"""
    result = await db.execute(
        select(models.Banner).where(models.Banner.id == banner_id)
    )
    return result.scalar_one_or_none()


async def update_banner(
    db: AsyncSession,
    banner_id: str,
    banner_update: schemas.BannerUpdate
) -> Optional[models.Banner]:
    """Update a banner"""
    update_data = banner_update.model_dump(exclude_unset=True)
    if not update_data:
        return await get_banner(db, banner_id)
    
    await db.execute(
        update(models.Banner)
        .where(models.Banner.id == banner_id)
        .values(**update_data)
    )
    await db.commit()
    return await get_banner(db, banner_id)


async def delete_banner(db: AsyncSession, banner_id: str) -> bool:
    """Delete a banner"""
    result = await db.execute(
        delete(models.Banner).where(models.Banner.id == banner_id)
    )
    await db.commit()
    return result.rowcount > 0


# ================== AUTH BACKGROUND CRUD ==================

async def create_auth_background(
    db: AsyncSession,
    auth_bg: schemas.AuthBackgroundCreate
) -> models.AuthBackground:
    """Create a new auth background"""
    db_auth_bg = models.AuthBackground(**auth_bg.model_dump())
    db.add(db_auth_bg)
    await db.commit()
    await db.refresh(db_auth_bg)
    return db_auth_bg


async def get_auth_backgrounds(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    active_only: bool = False
) -> List[models.AuthBackground]:
    """Get all auth backgrounds with optional filtering"""
    query = select(models.AuthBackground).order_by(
        models.AuthBackground.display_order,
        models.AuthBackground.created_at.desc()
    )
    
    if active_only:
        query = query.where(models.AuthBackground.is_active == True)
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


async def get_auth_background(
    db: AsyncSession,
    auth_bg_id: str
) -> Optional[models.AuthBackground]:
    """Get a single auth background by ID"""
    result = await db.execute(
        select(models.AuthBackground).where(models.AuthBackground.id == auth_bg_id)
    )
    return result.scalar_one_or_none()


async def update_auth_background(
    db: AsyncSession,
    auth_bg_id: str,
    auth_bg_update: schemas.AuthBackgroundUpdate
) -> Optional[models.AuthBackground]:
    """Update an auth background"""
    update_data = auth_bg_update.model_dump(exclude_unset=True)
    if not update_data:
        return await get_auth_background(db, auth_bg_id)
    
    await db.execute(
        update(models.AuthBackground)
        .where(models.AuthBackground.id == auth_bg_id)
        .values(**update_data)
    )
    await db.commit()
    return await get_auth_background(db, auth_bg_id)


async def delete_auth_background(db: AsyncSession, auth_bg_id: str) -> bool:
    """Delete an auth background"""
    result = await db.execute(
        delete(models.AuthBackground).where(models.AuthBackground.id == auth_bg_id)
    )
    await db.commit()
    return result.rowcount > 0


# ================== POSTER AD CRUD ==================

async def create_poster_ad(
    db: AsyncSession,
    poster_ad: schemas.PosterAdCreate
) -> models.PosterAd:
    """Create a new poster ad"""
    db_poster_ad = models.PosterAd(**poster_ad.model_dump())
    db.add(db_poster_ad)
    await db.commit()
    await db.refresh(db_poster_ad)
    return db_poster_ad


async def get_poster_ads(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    active_only: bool = False
) -> List[models.PosterAd]:
    """Get all poster ads with optional filtering"""
    query = select(models.PosterAd).order_by(
        models.PosterAd.display_order,
        models.PosterAd.created_at.desc()
    )
    
    if active_only:
        query = query.where(models.PosterAd.is_active == True)
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


async def get_poster_ad(db: AsyncSession, poster_ad_id: str) -> Optional[models.PosterAd]:
    """Get a single poster ad by ID"""
    result = await db.execute(
        select(models.PosterAd).where(models.PosterAd.id == poster_ad_id)
    )
    return result.scalar_one_or_none()


async def update_poster_ad(
    db: AsyncSession,
    poster_ad_id: str,
    poster_ad_update: schemas.PosterAdUpdate
) -> Optional[models.PosterAd]:
    """Update a poster ad"""
    update_data = poster_ad_update.model_dump(exclude_unset=True)
    if not update_data:
        return await get_poster_ad(db, poster_ad_id)
    
    await db.execute(
        update(models.PosterAd)
        .where(models.PosterAd.id == poster_ad_id)
        .values(**update_data)
    )
    await db.commit()
    return await get_poster_ad(db, poster_ad_id)


async def delete_poster_ad(db: AsyncSession, poster_ad_id: str) -> bool:
    """Delete a poster ad"""
    result = await db.execute(
        delete(models.PosterAd).where(models.PosterAd.id == poster_ad_id)
    )
    await db.commit()
    return result.rowcount > 0
