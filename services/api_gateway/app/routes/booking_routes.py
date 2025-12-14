from fastapi import APIRouter, Request, Depends
import os
from app.routes.baseRequest import verify_jwt, verify_admin, verify_jwt_optional, proxy

router = APIRouter()
BOOKING_SERVICE = os.getenv("SEATBOOKING_SERVICE_URL", "http://localhost:8004")

@router.api_route("/tickets", methods=["GET"])
async def get_tickets(request: Request, payload=Depends(verify_admin)):
    """Get all tickets/bookings for admin"""
    user_id = payload.get("sub") 
    return await proxy(request, "/tickets", BOOKING_SERVICE, str(user_id))

@router.api_route("/{booking_id}/checkin", methods=["POST"])
async def checkin_booking(request: Request, booking_id: str, payload=Depends(verify_admin)):
    """Check-in a booking (all seats for admin)"""
    user_id = payload.get("sub") 
    return await proxy(request, f"/{booking_id}/checkin", BOOKING_SERVICE, str(user_id))

@router.api_route("/seats/checkin", methods=["POST"])
async def checkin_seat(request: Request, payload=Depends(verify_admin)):
    """Check-in a seat using QR code or direct seatbookingId. Accepts optional JWT (QR scanners may not send token)."""
    user_id = payload.get("sub")
    return await proxy(request, "/seats/checkin", BOOKING_SERVICE, str(user_id) if user_id else None)

@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
async def booking_proxy(request: Request, path: str = "", payload=Depends(verify_jwt)):
    user_id = payload.get("sub") 
    return await proxy(request, f"/{path}", BOOKING_SERVICE, str(user_id))