from fastapi import APIRouter, Request, Depends
import os
from routes.baseRequest import verify_jwt, verify_admin, proxy

router = APIRouter()
CINEMA_SERVICE = os.getenv("CINEMA_SERVICE_URL", "http://localhost:8003")

@router.api_route("/{path:path}", methods=["GET"])
async def showtime_proxy(request: Request, path: str):
    return await proxy(request, f"/api/v1/showtimes/{path}", CINEMA_SERVICE)


@router.api_route("/{path:path}", methods=["POST", "PUT", "DELETE", "PATCH"])
async def showtime_proxy(request: Request, path: str, payload=Depends(verify_admin)):
    user_id = payload.get("sub")
    return await proxy(request, f"/api/v1/showtimes/{path}", CINEMA_SERVICE, str(user_id))
