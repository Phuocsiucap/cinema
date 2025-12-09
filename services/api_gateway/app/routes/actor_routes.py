from fastapi import APIRouter, Request, Depends
import os
from routes.baseRequest import verify_jwt, verify_admin, proxy

router = APIRouter()
CINEMA_SERVICE = os.getenv("CINEMA_SERVICE_URL", "http://localhost:8003")


# Public routes - không cần xác thực (GET)
@router.api_route("/{path:path}", methods=["GET"])
async def actor_public_proxy(request: Request, path: str):
    return await proxy(request, f"/api/v1/actors/{path}", CINEMA_SERVICE)


# Protected routes - cần xác thực (POST, PUT, DELETE, PATCH)
@router.api_route("/{path:path}", methods=["POST", "PUT", "DELETE", "PATCH"])
async def actor_protected_proxy(request: Request, path: str, payload=Depends(verify_admin)):
    user_id = payload.get("sub")
    return await proxy(request, f"/api/v1/actors/{path}", CINEMA_SERVICE, str(user_id) if user_id else None)
