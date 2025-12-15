from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Union
from datetime import date, datetime
from enum import Enum
import uuid


class MovieStatus(str, Enum):
    UPCOMING = "upcoming"        # Coming soon
    NOW_SHOWING = "now_showing"  # Now showing
    CLOSED = "closed"            # Closed


class ActorBase(BaseModel):
    name: str
    photo_url: Optional[str] = None
    
    class Config:
        from_attributes = True
        

    
class ActorResponse(ActorBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class MovieActorResponse(BaseModel):
    role_name: Optional[str] = None
    actor: ActorResponse 
    
    class Config:
        from_attributes = True

class MovieBase(BaseModel):
  
    title: str = Field(..., max_length=200)
    synopsis: str = Field(..., max_length=2000)
    description: Optional[str] = Field(None, max_length=1000)
    duration_minutes: int = Field(..., ge=0)
    release_date: Optional[date] = None 
    genre: str = Field(..., max_length=100)
    rating: Optional[str] = Field(None, max_length=10)
    imdb_rating: Optional[float] = None
    
    trailer_url: Optional[str] = Field(None, max_length=500)
    poster_url: Optional[str] = Field(None, max_length=500)
    background_url: Optional[str] = Field(None, max_length=500)
    director: Optional[str] = Field(None, max_length=100)
    status: MovieStatus = Field(default=MovieStatus.UPCOMING) 
    
class CastMemberBase(BaseModel):
    actor_id: Optional[str] = None
    name: str = Field(..., max_length=100)
    photo_url: Optional[str] = None
    role_name: Optional[str] = Field(None, max_length=100)

class CastMovieCreate(BaseModel):
    movie_id: str
    cast_members: List[CastMemberBase] = Field(default_factory=list)

class MovieCreate(MovieBase):
    cast_members: Optional[List[CastMemberBase]] = None
    
class MovieBasicResponse(BaseModel):
    id: str
    title: str = Field(..., max_length=200)
    synopsis: str = Field(..., max_length=2000)
    poster_url: Optional[str] = Field(None, max_length=500)
    status: MovieStatus
    duration_minutes: int = Field(..., ge=0)
    release_date: Optional[date] = None
    rating: Optional[str] = Field(None, max_length=10)
    imdb_rating: Optional[float] = None
    genre: str = Field(..., max_length=100)
    director: Optional[str] = Field(None, max_length=100)
    
    class Config:
        from_attributes = True
    
    
class MovieResponse(MovieBase):
    id: str
    status: MovieStatus
    created_at: datetime
    updated_at: datetime
    
    cast: List[MovieActorResponse] = Field(default_factory=list, alias="actor_associations") 

    class Config:
        from_attributes = True
        populate_by_name = True
        
class PaginatedMovieResponse(BaseModel):
    """Schema for paginated response"""
    total_count: int
    page: int
    size: int
    items: List['MovieBasicResponse']
    
    class Config:
        from_attributes = True 
        
        
class SeatType(str, Enum):
    STANDARD = "STANDARD"
    VIP = "VIP"
    COUPLE = "COUPLE"

# ================= SEAT SCHEMAS =================
class SeatBase(BaseModel):
    row: str = Field(..., max_length=5)
    number: int = Field(..., ge=1)
    seat_type: SeatType = SeatType.STANDARD
    is_active: bool = True  # False = broken seat/aisle

class SeatCreate(SeatBase):
    pass

class SeatResponse(SeatBase):
    id: str
    room_id: str
    class Config:
        from_attributes = True 

class SeatStatus(str, Enum):
    AVAILABLE = "available"
    BOOKED = "booked"  # Booked (exists in seat_bookings with confirmed booking)

class SeatWithStatusResponse(SeatBase):
    """Seat response with status for specific showtime"""
    id: str
    room_id: str
    status: SeatStatus = SeatStatus.AVAILABLE
    
    class Config:
        from_attributes = True

# ================= ROOM SCHEMAS =================
class CinemaRoomBase(BaseModel):
    name: str = Field(..., max_length=100)
    
class CinemaRoomCreate(CinemaRoomBase):
    # Nested: Create Room with list of seats
    seats: List[SeatCreate] = Field(default_factory=list)

class CinemaRoomResponse(CinemaRoomBase):
    id: str
    cinema_id: str
    seat_count: int
    # Nested: Return Room with list of seats (for drawing diagram)
    seats: List[SeatResponse] = Field(default_factory=list) 
    class Config:
        from_attributes = True

# ================= CINEMA SCHEMAS =================
class CinemaBase(BaseModel):
    name: str = Field(..., max_length=200)
    address: Optional[str] = Field(None, max_length=255)
    city: str = Field(..., max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    latitude: Optional[float] = None 
    longitude: Optional[float] = None
    
class CinemaCreate(CinemaBase):
    pass
    # Nested: Create Cinema with list of Rooms
class AddRoomToCenema(BaseModel):
    cinema_id: str
    rooms: List[CinemaRoomCreate] = Field(default_factory=list)

class CinemaUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_active: Optional[bool] = None

# ================= ROOM UPDATE SCHEMA =================
class SeatUpdate(SeatBase):
    """Schema for updating seats"""
    pass

class CinemaRoomUpdate(BaseModel):
    """Schema for updating cinema room"""
    name: Optional[str] = None
    seats: Optional[List[SeatUpdate]] = None  # If seats provided, will replace all seats

class CinemaResponse(CinemaBase):
    id: str
    total_rooms: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    # Nested: Return Cinema with list of Rooms
    rooms: List[CinemaRoomResponse] = Field(default_factory=list) 
    class Config:
        from_attributes = True

class CinemaBasicResponse(BaseModel):
    """Brief cinema info for showtime"""
    id: str
    name: str
    city: str
    
    class Config:
        from_attributes = True
        
        
#================== showtime schemas ==================
class ShowtimeBase(BaseModel):
    movie_id: str
    room_id: str
    start_time: datetime
    price: float
    
class ShowtimeCreate(ShowtimeBase):
    pass

class ShowtimeUpdate(BaseModel):
    movie_id: Optional[str] = None
    room_id: Optional[str] = None
    start_time: Optional[datetime] = None
    price: Optional[float] = None

class ShowtimeRoomResponse(BaseModel):
    id: str
    name: str
    cinema: Optional[CinemaBasicResponse] = None
    
    class Config:
        from_attributes = True

class ShowtimeMovieResponse(BaseModel):
    id: str
    title: str
    poster_url: Optional[str] = None
    duration_minutes: int
    
    class Config:
        from_attributes = True
    
class ShowtimeResponse(BaseModel):
    id: str
    movie_id: str
    room_id: str
    start_time: datetime
    end_time: datetime
    price: float
    movie: Optional[ShowtimeMovieResponse] = None
    room: Optional[ShowtimeRoomResponse] = None
    
    class Config:
        from_attributes = True


# ================== booking schemas ==================
class BookingStatus(str, Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    
class SeatBookingBase(BaseModel):
    seat_id: str
    showtime_id: str
class SeatBookingCreate(SeatBookingBase):
    pass
class SeatBookingResponse(SeatBookingBase):
    id: str
    price: float
    qr_code_url: Optional[str] = None
    is_used: bool
    seat: SeatResponse
    class Config:
        from_attributes = True
        
class BookingBase(BaseModel):
    totoal_amount: float
    payment_method: Optional[str] = None
    transaction_reference: Optional[str] = None
    
class BookingCreate(BookingBase):
    seats_to_book: List[SeatBookingCreate]
    
class BookingResponse(BookingBase):
    id: str
    user_id: str
    status: BookingStatus
    payment_method: Optional[str] = None
    transaction_reference: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    tickets: List[SeatBookingResponse] = Field(default_factory=list, alias="tickets")
    
    class Config:
        from_attributes = True
        populate_by_name = True
    
    
    
    
# ================== dashboard schemas ==================
class BasicStatsResponse(BaseModel):
    total_movies: int
    total_cinemas: int 
    total_users: int
    total_tickets: int
    new_movies_this_month: int
    new_cinemas_this_month: int
    new_users_this_month: int
    new_tickets_this_month: int
    
class RenvenueStatsResponse(BaseModel):
    total_revenue_month: float
    total_new_tickets_now: int
    total_showtimes_now: int
    
class TopMovieThisMonthResponse(BaseModel):
    id: str
    movie_name: str
    tickets_sold: int
    revenue: float
    poster_url: str
    
class BookingStatsResponse(BaseModel):
    id: str
    created_time: datetime
    total: float
    user_name: str
    name_of_steats: List[str]
    status: BookingStatus
    
class DashboardResponse(BaseModel):
    basic_stats: BasicStatsResponse
    revenue_stats: RenvenueStatsResponse
    top_movies: List[TopMovieThisMonthResponse]
    recent_bookings: List[BookingStatsResponse]


# ================== revenue schemas ==================
class RevenueComparisonRequest(BaseModel):
    period_type: Literal['day', 'month', 'year'] = 'month'
    start_date: Optional[date] = None  # Optional because router can set default
    end_date: Optional[date] = None    # Optional because router can set default
    comparison_type: Literal['cinema', 'room', 'movie'] = 'cinema'
    limit: int = Field(default=10, ge=1, le=50)
    sort_by: Literal['revenue', 'tickets', 'occupancy'] = 'revenue'
    
class CinemaEntityInfo(BaseModel):
    city: str
    total_rooms: int

class RoomEntityInfo(BaseModel):
    cinema_name: str
    seat_capacity: int
    screen_type: Optional[str] = None

class MovieEntityInfo(BaseModel):
    genre: str
    rating: Optional[str] = None
    director: Optional[str] = None
    

EntityInfo = Union[CinemaEntityInfo, RoomEntityInfo, MovieEntityInfo]
    

class ComparisonItem(BaseModel):
    entity_id: str
    entity_name: str
    entity_info: EntityInfo
    revenue: float
    tickets_sold: int
    avg_ticket_price: float
    occupancy_rate: float
    shows_count: int
    percentage: float


class RevenueComparisonResponse(BaseModel):
    comparison_type: str
    period_type: str
    start_date: date
    end_date: date
    total_entities: int
    data: List[ComparisonItem]


# Detailed revenue item for a specific day
class RevenueDetailItem(BaseModel):
    date: date
    revenue: float
    tickets_sold: int


# Detailed revenue response for a single entity (cinema/room/movie)
class RevenueDetailResponse(BaseModel):
    entity_id: str
    entity_name: str
    period_type: str
    total_revenue: float
    total_tickets: int
    data: List[RevenueDetailItem]