from fastapi import Request, HTTPException
from starlette.responses import Response
import httpx
import os
import jwt
from typing import Optional
from dotenv import load_dotenv
import certifi


load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

def verify_jwt(request: Request):
    auth = request.headers.get("Authorization")
    if not auth:
        raise HTTPException(status_code=401, detail="Token missing")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid header")
    
    token = auth.split(" ")[1]
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except:  
        raise HTTPException(status_code=401, detail="Invalid token")

def verify_jwt_optional(request: Request):
    """Optional JWT verification - returns None if no token"""
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        return None
    
    token = auth.split(" ")[1]
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except:
        return None

def verify_admin(request: Request):
    """Verify JWT and check if user has admin role"""
    auth = request.headers.get("Authorization")
    if not auth:
        raise HTTPException(status_code=401, detail="Token missing")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid header")
    
    token = auth.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Check if user has admin role
        role = payload.get("role")
        if role != "admin":
            raise HTTPException(status_code=403, detail="You do not have permission to access this resource")
        
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except HTTPException:
        raise
    except:
        raise HTTPException(status_code=401, detail="Invalid token")
    
async def proxy(request: Request, path: str, url_service: str, user_id: Optional[str] = None):
    url = url_service + path
    method = request.method.lower()
    headers = dict(request.headers)
    # Chỉ loại bỏ Host header nếu URL không phải localhost (để tránh vấn đề với external services)
    if not url_service.startswith("http://localhost"):
        headers.pop('host', None)
    if user_id:
        headers["x-user-id"] = user_id
    
    body = await request.body()
    params = dict(request.query_params)
    
    # Tăng timeout lên 60 giây để tránh ReadTimeout
    timeout = httpx.Timeout(60.0, connect=10.0)
    
    async with httpx.AsyncClient(timeout=timeout, verify=certifi.where()) as client:
        resp = await client.request(
            method,
            url,
            headers=headers,
            params=params,
            content=body
        )
        print(resp)
        return Response(
            content=resp.content,
            status_code=resp.status_code,
            headers=resp.headers
        )