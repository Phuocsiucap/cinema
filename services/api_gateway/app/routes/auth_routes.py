from fastapi import APIRouter, Request
import os
from routes.baseRequest import proxy

router = APIRouter()
AUTH_SERVICE = os.getenv("AUTH_SERVICE_URL", "http://localhost:8002")
SEATBOOKING_SERVICE = os.getenv("SEATBOOKING_SERVICE_URL", "http://localhost:8004")


@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def auth_proxy(request: Request, path: str):
    # Route email-related endpoints to seatbooking service
    if path in ["send-otp-email", "verify-otp", "forgot-password", "reset-password-otp"]:
        return await proxy(request, f"/{path}", SEATBOOKING_SERVICE)
    
    # Other auth endpoints go to auth service
    return await proxy(request, f"/api/v1/auth/{path}", AUTH_SERVICE)
