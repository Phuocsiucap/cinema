import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from starlette.middleware.proxy_headers import ProxyHeadersMiddleware  # 👈 THÊM DÒNG NÀY
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
    
    # 👇 THÊM PROXY MIDDLEWARE ĐẦU TIÊN (QUAN TRỌNG CHO RENDER)
    app.add_middleware(ProxyHeadersMiddleware, trusted_hosts=["*"])
    
    # 👇 SESSION MIDDLEWARE CHUẨN CHO PRODUCTION
    is_render = os.getenv("RENDER_SERVICE_ID") is not None  # Tự động phát hiện Render
    
    app.add_middleware(
        SessionMiddleware,
        secret_key=os.getenv("SESSION_SECRET", "dev-secret-key-here"),  # DÙNG SESSION_SECRET RIÊNG
        same_site="none" if is_render else "lax",  # "none" cho production, "lax" cho local
        https_only=is_render,  # BẬT HTTPS TRÊN RENDER
        max_age=3600
    )
    
    # 👇 CORS AN TOÀN CHO OAUTH
    frontend_url =  "http://localhost:8000"
    origins = ["*"] if not is_render else [frontend_url]  # DÙNG WILDCARD CHO LOCAL, DOMAIN CHO PROD
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,  # LUÔN BẬT CHO SESSION
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
    app.include_router(users_router, prefix="/api/v1/users", tags=["Users"])
    
    @app.get("/health")
    def health_check():
        return {"status": "auth service is running"}
    
    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("SERVICE_PORT", 8002))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)