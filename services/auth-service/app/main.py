# app/main.py
import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from contextlib import asynccontextmanager

# Import các router và database
from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.database import Base, engine

load_dotenv()

# --- 1. QUẢN LÝ KẾT NỐI DB ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Mở kết nối DB khi app khởi động
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Đóng kết nối DB khi app tắt
    await engine.dispose()

def create_app() -> FastAPI:
    app = FastAPI(title="Auth Service", version="1.0.0", lifespan=lifespan)
    
    # --- 2. CẤU HÌNH CORS ---
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"], # Hoặc điền cụ thể ["http://localhost:5173", "https://web-cua-ban.onrender.com"]
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # --- 3. ĐĂNG KÝ ROUTER ---
    app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
    app.include_router(users_router, prefix="/api/v1/users", tags=["Users"])
    
    # --- 4. HEALTH CHECK ---
    @app.get("/health")
    async def health_check():
        return {
            "status": "active",
            "mode": "JWT Stateless - No Proxy Headers",
            "environment": "render" if os.getenv("RENDER") else "local"
        }
    
    return app

app = create_app()

if __name__ == "__main__":
    
    port = int(os.getenv("PORT", 8000))
    
    # Kiểm tra xem đang chạy trên Render hay Local
    is_on_render = os.getenv("RENDER") is not None
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=not is_on_render,      # Local thì reload code tự động
        workers=4 if is_on_render else 1 # Render thì chạy nhiều workers cho khỏe
    )