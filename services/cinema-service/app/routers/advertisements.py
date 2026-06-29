from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app import schemas, database, crud_advertisement

router = APIRouter()


# ================== BANNER ROUTES ==================

@router.post("/banners", response_model=schemas.BannerResponse, tags=["Banners"])
async def create_banner(
    banner: schemas.BannerCreate,
    db: AsyncSession = Depends(database.get_db)
):
    """Create a new banner advertisement"""
    return await crud_advertisement.create_banner(db, banner)


@router.get("/banners", response_model=List[schemas.BannerResponse], tags=["Banners"])
async def list_banners(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    active_only: bool = Query(False, description="Filter only active banners"),
    db: AsyncSession = Depends(database.get_db)
):
    """Get all banners"""
    return await crud_advertisement.get_banners(db, skip=skip, limit=limit, active_only=active_only)


@router.get("/banners/{banner_id}", response_model=schemas.BannerResponse, tags=["Banners"])
async def get_banner(
    banner_id: str,
    db: AsyncSession = Depends(database.get_db)
):
    """Get a single banner by ID"""
    banner = await crud_advertisement.get_banner(db, banner_id)
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")
    return banner


@router.put("/banners/{banner_id}", response_model=schemas.BannerResponse, tags=["Banners"])
async def update_banner(
    banner_id: str,
    banner_update: schemas.BannerUpdate,
    db: AsyncSession = Depends(database.get_db)
):
    """Update a banner"""
    banner = await crud_advertisement.update_banner(db, banner_id, banner_update)
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")
    return banner


@router.delete("/banners/{banner_id}", tags=["Banners"])
async def delete_banner(
    banner_id: str,
    db: AsyncSession = Depends(database.get_db)
):
    """Delete a banner"""
    success = await crud_advertisement.delete_banner(db, banner_id)
    if not success:
        raise HTTPException(status_code=404, detail="Banner not found")
    return {"message": "Banner deleted successfully"}


# ================== AUTH BACKGROUND ROUTES ==================

@router.post("/auth-backgrounds", response_model=schemas.AuthBackgroundResponse, tags=["Auth Backgrounds"])
async def create_auth_background(
    auth_bg: schemas.AuthBackgroundCreate,
    db: AsyncSession = Depends(database.get_db)
):
    """Create a new auth background"""
    return await crud_advertisement.create_auth_background(db, auth_bg)


@router.get("/auth-backgrounds", response_model=List[schemas.AuthBackgroundResponse], tags=["Auth Backgrounds"])
async def list_auth_backgrounds(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    active_only: bool = Query(False, description="Filter only active backgrounds"),
    db: AsyncSession = Depends(database.get_db)
):
    """Get all auth backgrounds"""
    return await crud_advertisement.get_auth_backgrounds(db, skip=skip, limit=limit, active_only=active_only)


@router.get("/auth-backgrounds/{auth_bg_id}", response_model=schemas.AuthBackgroundResponse, tags=["Auth Backgrounds"])
async def get_auth_background(
    auth_bg_id: str,
    db: AsyncSession = Depends(database.get_db)
):
    """Get a single auth background by ID"""
    auth_bg = await crud_advertisement.get_auth_background(db, auth_bg_id)
    if not auth_bg:
        raise HTTPException(status_code=404, detail="Auth background not found")
    return auth_bg


@router.put("/auth-backgrounds/{auth_bg_id}", response_model=schemas.AuthBackgroundResponse, tags=["Auth Backgrounds"])
async def update_auth_background(
    auth_bg_id: str,
    auth_bg_update: schemas.AuthBackgroundUpdate,
    db: AsyncSession = Depends(database.get_db)
):
    """Update an auth background"""
    auth_bg = await crud_advertisement.update_auth_background(db, auth_bg_id, auth_bg_update)
    if not auth_bg:
        raise HTTPException(status_code=404, detail="Auth background not found")
    return auth_bg


@router.delete("/auth-backgrounds/{auth_bg_id}", tags=["Auth Backgrounds"])
async def delete_auth_background(
    auth_bg_id: str,
    db: AsyncSession = Depends(database.get_db)
):
    """Delete an auth background"""
    success = await crud_advertisement.delete_auth_background(db, auth_bg_id)
    if not success:
        raise HTTPException(status_code=404, detail="Auth background not found")
    return {"message": "Auth background deleted successfully"}


# ================== POSTER AD ROUTES ==================

@router.post("/poster-ads", response_model=schemas.PosterAdResponse, tags=["Poster Ads"])
async def create_poster_ad(
    poster_ad: schemas.PosterAdCreate,
    db: AsyncSession = Depends(database.get_db)
):
    """Create a new poster ad"""
    return await crud_advertisement.create_poster_ad(db, poster_ad)


@router.get("/poster-ads", response_model=List[schemas.PosterAdResponse], tags=["Poster Ads"])
async def list_poster_ads(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    active_only: bool = Query(False, description="Filter only active poster ads"),
    db: AsyncSession = Depends(database.get_db)
):
    """Get all poster ads"""
    return await crud_advertisement.get_poster_ads(db, skip=skip, limit=limit, active_only=active_only)


@router.get("/poster-ads/{poster_ad_id}", response_model=schemas.PosterAdResponse, tags=["Poster Ads"])
async def get_poster_ad(
    poster_ad_id: str,
    db: AsyncSession = Depends(database.get_db)
):
    """Get a single poster ad by ID"""
    poster_ad = await crud_advertisement.get_poster_ad(db, poster_ad_id)
    if not poster_ad:
        raise HTTPException(status_code=404, detail="Poster ad not found")
    return poster_ad


@router.put("/poster-ads/{poster_ad_id}", response_model=schemas.PosterAdResponse, tags=["Poster Ads"])
async def update_poster_ad(
    poster_ad_id: str,
    poster_ad_update: schemas.PosterAdUpdate,
    db: AsyncSession = Depends(database.get_db)
):
    """Update a poster ad"""
    poster_ad = await crud_advertisement.update_poster_ad(db, poster_ad_id, poster_ad_update)
    if not poster_ad:
        raise HTTPException(status_code=404, detail="Poster ad not found")
    return poster_ad


@router.delete("/poster-ads/{poster_ad_id}", tags=["Poster Ads"])
async def delete_poster_ad(
    poster_ad_id: str,
    db: AsyncSession = Depends(database.get_db)
):
    """Delete a poster ad"""
    success = await crud_advertisement.delete_poster_ad(db, poster_ad_id)
    if not success:
        raise HTTPException(status_code=404, detail="Poster ad not found")
    return {"message": "Poster ad deleted successfully"}
