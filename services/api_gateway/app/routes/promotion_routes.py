from fastapi import APIRouter, Request, Depends
import os
from app.routes.baseRequest import verify_jwt, verify_admin, proxy

router = APIRouter()
BOOKING_SERVICE = os.getenv("BOOKING_SERVICE_URL", "http://localhost:8004")

# Public routes
@router.api_route("/active", methods=["GET"])
async def get_active_promotions(request: Request):
    """Get all active promotions (public)"""
    return await proxy(request, "/promotions/active", BOOKING_SERVICE)

@router.api_route("/validate", methods=["POST"])
async def validate_promotion(request: Request, payload=Depends(verify_jwt)):
    """Validate promotion code"""
    user_id = payload.get("sub")
    return await proxy(request, "/promotions/validate", BOOKING_SERVICE, str(user_id))

# Admin routes
@router.api_route("/{promotion_id}", methods=["GET"])
async def get_promotion(request: Request, promotion_id: str, payload=Depends(verify_admin)):
    """Get promotion by ID (admin only)"""
    user_id = payload.get("sub")
    return await proxy(request, f"/promotions/{promotion_id}", BOOKING_SERVICE, str(user_id))

@router.api_route("/{promotion_id}", methods=["PUT"])
async def update_promotion(request: Request, promotion_id: str, payload=Depends(verify_admin)):
    """Update promotion (admin only)"""
    user_id = payload.get("sub")
    return await proxy(request, f"/promotions/{promotion_id}", BOOKING_SERVICE, str(user_id))

@router.api_route("/{promotion_id}", methods=["DELETE"])
async def delete_promotion(request: Request, promotion_id: str, payload=Depends(verify_admin)):
    """Delete promotion (admin only)"""
    user_id = payload.get("sub")
    return await proxy(request, f"/promotions/{promotion_id}", BOOKING_SERVICE, str(user_id))

@router.api_route("/", methods=["GET"])
async def get_promotions(request: Request, payload=Depends(verify_admin)):
    """Get all promotions with pagination (admin only)"""
    user_id = payload.get("sub")
    return await proxy(request, "/promotions", BOOKING_SERVICE, str(user_id))

@router.api_route("/", methods=["POST"])
async def create_promotion(request: Request, payload=Depends(verify_admin)):
    """Create new promotion (admin only)"""
    user_id = payload.get("sub")
    return await proxy(request, "/promotions", BOOKING_SERVICE, str(user_id))
