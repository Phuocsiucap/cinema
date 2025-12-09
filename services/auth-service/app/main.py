# app/main.py - PHIÊN BẢN ĐÃ ĐƯỢC TỐI ƯU CHO RENDER
import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from starlette.middleware.proxy_headers import ProxyHeadersMiddleware
from dotenv import load_dotenv
from contextlib import asynccontextmanager

from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.database import Base, engine

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()

def create_app() -> FastAPI:
    app = FastAPI(title="Auth Service", version="1.0.0", lifespan=lifespan)
    
    # 👇 1. PROXY HEADERS MIDDLEWARE ĐẦU TIÊN
    app.add_middleware(ProxyHeadersMiddleware, trusted_hosts=["*"])
    
    # 👇 2. SESSION MIDDLEWARE VỚI CẤU HÌNH PRODUCTION
    is_render = "RENDER_SERVICE_ID" in os.environ
    app.add_middleware(
        SessionMiddleware,
        secret_key=os.getenv("SESSION_SECRET"),  # BẮT BUỘC CÓ TRÊN RENDER
        same_site="none" if is_render else "lax",
        https_only=is_render,
        max_age=3600
    )
    
    # 👇 3. CORS CHÍNH XÁC CHO OAUTH
    frontend_url = "http://localhost:8000"
    origins = [frontend_url] if is_render else ["*"]
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,  # BẮT BUỘC CHO SESSION
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
    app.include_router(users_router, prefix="/api/v1/users", tags=["Users"])
    
    @app.get("/health")
    async def health_check():
        return {
            "status": "running",
            "environment": "render" if is_render else "local",
            "session_config": {
                "same_site": "none" if is_render else "lax",
                "https_only": is_render
            }
        }
    
    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=not os.getenv("RENDER_SERVICE_ID"),
        workers=4 if os.getenv("RENDER_SERVICE_ID") else 1
    )