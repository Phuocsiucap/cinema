from fastapi import APIRouter, Request, Depends
import os
from routes.baseRequest import verify_jwt,verify_admin, proxy

router = APIRouter()
USER_SERVICE = os.getenv("AUTH_SERVICE_URL", "http://localhost:8002")


@router.api_route("/", methods=["GET"])
async def user_list(request: Request, payload=Depends(verify_admin)):
    user_id = payload.get("sub")
    return await proxy(request, f"/api/v1/users/", USER_SERVICE, str(user_id))

@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def user_proxy(request: Request, path: str, payload=Depends(verify_jwt)):
    user_id = payload.get("sub")
    return await proxy(request, f"/api/v1/users/{path}", USER_SERVICE, str(user_id) if user_id else None)

@router.post("/verify-account")
async def verify_account(request: Request, payload=Depends(verify_jwt)):
    """Verify user account - routes to auth service"""
    user_id = payload.get("sub")
    return await proxy(request, f"/api/v1/auth/verify-account", USER_SERVICE, str(user_id))
