import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
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
    
    # DETECT RENDER ENVIRONMENT
    is_render = os.environ.get("RENDER_SERVICE_ID") is not None
    
    # SESSION MIDDLEWARE - CẤU HÌNH AN TOÀN CHO RENDER
    app.add_middleware(
        SessionMiddleware,
        secret_key=os.getenv("SESSION_SECRET", "dev-secret-key-for-local-only"),
        same_site="none" if is_render else "lax",
        https_only=is_render,  # TỰ ĐỘNG BẬT HTTPS TRÊN RENDER
        max_age=3600
    )
    
    # CORS CONFIG - KHÔNG DÙNG WILDCARD TRÊN PRODUCTION
    frontend_url =  "http://localhost:8000"
    origins = ["*"] if not is_render else [frontend_url]
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
    app.include_router(users_router, prefix="/api/v1/users", tags=["Users"])
    
    @app.get("/health")
    async def health_check():
        return {"status": "auth service is running", "environment": "render" if is_render else "local"}
    
    return app

app = create_app()

if __name__ == "__main__":
    # Render sử dụng PORT environment variable
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=not os.getenv("RENDER_SERVICE_ID"),  # Tắt reload trên production
        workers=4 if os.getenv("RENDER_SERVICE_ID") else 1
    )