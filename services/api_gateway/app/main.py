import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import uvicorn

# Import routes
from app.routes.auth_routes import router as auth_router
from app.routes.user_routes import router as user_router
from app.routes.cinema_routes import router as cinema_router
from app.routes.movie_routes import router as movie_router
from app.routes.actor_routes import router as actor_router
from app.routes.showtime_routes import router as showtime_router
from app.routes.booking_routes import router as booking_router
from app.routes.dashboard_routes import router as dashboard_router
from app.routes.promotion_routes import router as promotion_router
from app.routes.revenue_routes import router as revenue_router
from app.routes.upload_routes import router as upload_router
# from aroutes.order_routes import router as order_router
load_dotenv()
app = FastAPI(title="API Gateway")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    #allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth_router, prefix="/api/v1/auth")
app.include_router(user_router, prefix="/api/v1/users")
app.include_router(cinema_router, prefix="/api/v1/cinemas")
app.include_router(movie_router, prefix="/api/v1/movies")
app.include_router(actor_router, prefix="/api/v1/actors")
app.include_router(showtime_router, prefix="/api/v1/showtimes")
app.include_router(booking_router,prefix="/api/v1/bookings")
app.include_router(dashboard_router, prefix="/api/v1/dashboard")
app.include_router(promotion_router, prefix="/api/v1/promotions")
app.include_router(revenue_router, prefix="/api/v1/revenue")
app.include_router(upload_router, prefix="/api/v1/upload")


@app.get("/health")
def health():
    return {"gateway": "OK"}

if __name__ == "__main__":
    port = int(os.getenv("GATEWAY_PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)