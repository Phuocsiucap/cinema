from fastapi import APIRouter, Depends, Request, HTTPException, Query
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
import schemas, database, crud_dashboard
import os

router = APIRouter()

@router.get("/", response_model=schemas.DashboardResponse)
async def get_dashboard_stats(db: AsyncSession = Depends(database.get_db)):
    stats = await crud_dashboard.get_dashboard_stats(db)
    revenue_stats = await crud_dashboard.get_dashboard_revenue_stats(db)
    top_movies = await crud_dashboard.get_top_movies_this_month(db)
    booking_stats = await crud_dashboard.get_recent_bookings(db)
    return schemas.DashboardResponse(
        basic_stats=stats,
        revenue_stats=revenue_stats,
        top_movies=top_movies,
        recent_bookings=booking_stats
    )