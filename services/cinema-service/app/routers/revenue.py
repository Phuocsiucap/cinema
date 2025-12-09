from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app import schemas, database, crud_revenue
from typing import Optional
from datetime import date

router = APIRouter()



@router.get("/", response_model=schemas.RevenueComparisonResponse)
async def get_revenue_comparison(
    period_type: Optional[str] = Query('month'),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    comparison_type: str = Query('cinema'),
    limit: int = Query(10, ge=1, le=50),
    sort_by: str = Query('revenue'),
    db: AsyncSession = Depends(database.get_db)
):
    """Get revenue comparison data for dashboard overview"""
    params = schemas.RevenueComparisonRequest(
        period_type=period_type,
        start_date=start_date,
        end_date=end_date,
        comparison_type=comparison_type,
        limit=limit,
        sort_by=sort_by
    )
    
    data = await crud_revenue.get_revenue_comparison(db, params)
    return data