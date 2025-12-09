import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from contextlib import asynccontextmanager

from app.routers.movies import router as movies_router
from app.routers.cinemas import router as cinemas_router
from app.routers.actors import router as actors_router
from app.routers.show_times import router as showtimes_router
from app.routers.dashboard import router as dashboard_router
from app.routers.revenue import router as revenue_router

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
    app = FastAPI(title="Cinema Service", version="1.0.0", lifespan=lifespan)
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    app.include_router(movies_router, prefix="/api/v1/movies", tags=["Movie"])
    app.include_router(cinemas_router, prefix="/api/v1/cinemas", tags=["Cinema"])
    app.include_router(actors_router, prefix="/api/v1/actors", tags=["Actor"])
    app.include_router(showtimes_router, prefix="/api/v1/showtimes", tags=["Showtime"])
    app.include_router(dashboard_router, prefix="/api/v1/dashboard", tags=["Dashboard"])
    app.include_router(revenue_router, prefix="/api/v1/revenue", tags=["Revenue"])
    
    @app.get("/health")
    def health_check():
        return {"status": "cinema service is running"}
    
    return app
app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("SERVICE_PORT", 8003))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)