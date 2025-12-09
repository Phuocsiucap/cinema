from fastapi import APIRouter, Request, Depends
import os
from app.routes.baseRequest import verify_jwt, verify_admin, proxy

router = APIRouter()
CINEMA_SERVICE = os.getenv("CINEMA_SERVICE_URL", "http://localhost:8003")

@router.api_route("/{path:path}", methods=["GET"])
async def cinema_protected_proxy(request: Request, path: str, payload=Depends(verify_admin)):
    user_id = payload.get("sub")
    return await proxy(request, f"/api/v1/dashboard/{path}", CINEMA_SERVICE, str(user_id))