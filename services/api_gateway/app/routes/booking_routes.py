from fastapi import APIRouter, Request, Depends
import os
from app.routes.baseRequest import verify_jwt, verify_admin, proxy

router = APIRouter()
BOOKING_SERVICE = os.getenv("SEATBOOKING_SERVICE_URL", "http://localhost:8004")

@router.api_route("/tickets", methods=["GET"])
async def get_tickets(request: Request, payload=Depends(verify_admin)):
    """Get all tickets/bookings for admin"""
    user_id = payload.get("sub") 
    return await proxy(request, "/tickets", BOOKING_SERVICE, str(user_id))

@router.api_route("/{booking_id}/checkin", methods=["POST"])
async def checkin_booking(request: Request, booking_id: str, payload=Depends(verify_admin)):
    """Check-in a booking"""
    user_id = payload.get("sub") 
    return await proxy(request, f"/{booking_id}/checkin", BOOKING_SERVICE, str(user_id))

@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
async def booking_proxy(request: Request, path: str = "", payload=Depends(verify_jwt)):
    user_id = payload.get("sub") 
    return await proxy(request, f"/{path}", BOOKING_SERVICE, str(user_id))