import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from contextlib import asynccontextmanager

from app.routers.users import router as users_router
from app.database import Base, engine

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown: Dispose engine
    await engine.dispose()

def create_app() -> FastAPI:
    app = FastAPI(title="User Service", version="1.0.0", lifespan=lifespan)
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    app.include_router(users_router, prefix="/api/v1/users", tags=["Users"])
    
    @app.get("/health")
    def health_check():
        return {"status": "user service is running"}
    
    return app
app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("SERVICE_PORT", 8001))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)