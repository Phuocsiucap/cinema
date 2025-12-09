from sqlalchemy import Column, Integer, Float, String, DateTime, Boolean, ForeignKey, UniqueConstraint, Date, Enum, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from app.database import Base
from sqlalchemy.dialects.postgresql import UUID


class UserRole(enum.Enum):
    CUSTOMER = "customer"
    ADMIN = "admin"
    SELLER = "seller"

class MovieStatus(str, enum.Enum):
    UPCOMING = "upcoming"
    NOW_SHOWING = "now_showing"
    CLOSED = "closed"

class SeatType(str, enum.Enum):
    STANDARD = "STANDARD"
    VIP = "VIP"
    COUPLE = "COUPLE"

class BookingStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    REFUNDED = "REFUNDED"
    
class Movie(Base):
    __tablename__ = "movies"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    title = Column(String(200), nullable=False, index=True)
    synopsis = Column(String(2000), nullable=False)
    description = Column(String(1000), nullable=True)
    duration_minutes = Column(Integer, nullable=False)
    release_date = Column(Date, nullable=True)
    genre = Column(String(100), nullable=False, index=True)
    rating = Column(String(10), nullable=True)
    imdb_rating = Column(Float, nullable=True)
    director = Column(String(100), nullable=True)
    trailer_url = Column(String(500), nullable=True)
    poster_url = Column(String(500), nullable=True)
    background_url = Column(String(500), nullable=True)
    status = Column(Enum(MovieStatus), default=MovieStatus.UPCOMING, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    actor_associations = relationship("MovieActor", back_populates="movie")

class Actor(Base):
    __tablename__ = "actors"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    name = Column(String(100), nullable=False, index=True)
    photo_url = Column(Text, nullable=True)  # Changed from String(10000) to Text for base64 images
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    movie_associations = relationship("MovieActor", back_populates="actor")

class MovieActor(Base):
    __tablename__ = "movie_actors"
    movie_id = Column(String(36), ForeignKey("movies.id"), primary_key=True)
    actor_id = Column(String(36), ForeignKey("actors.id"), primary_key=True)
    role_name = Column(String(100), nullable=True)
    movie = relationship("Movie", back_populates="actor_associations")
    actor = relationship("Actor", back_populates="movie_associations")
    __table_args__ = (UniqueConstraint('movie_id', 'actor_id', name='uq_movie_actor'),)

# --- CINEMA INFRASTRUCTURE MODELS ---

class Cinema(Base):
    __tablename__ = "cinemas"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    name = Column(String(200), nullable=False, index=True)
    address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    description = Column(String(500))
    total_rooms = Column(Integer, default=0) 
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    rooms = relationship("CinemaRoom", back_populates="cinema")

class CinemaRoom(Base):
    __tablename__ = "cinema_rooms"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    name = Column(String(100), nullable=False)
    seat_count = Column(Integer, nullable=False, default=0)
    cinema_id = Column(String(36), ForeignKey("cinemas.id"), nullable=False)

    cinema = relationship("Cinema", back_populates="rooms")
    showtimes = relationship("Showtime", back_populates="room")
    seats = relationship("Seat", back_populates="room")

class Seat(Base):
    __tablename__ = "seats"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    room_id = Column(String(36), ForeignKey("cinema_rooms.id"), nullable=False)
    row = Column(String(5), nullable=False)
    number = Column(Integer, nullable=False)
    
    seat_type = Column(Enum(SeatType), default=SeatType.STANDARD, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    room = relationship("CinemaRoom", back_populates="seats")
    bookings = relationship("SeatBooking", back_populates="seat")
    
    
    __table_args__ = (UniqueConstraint('room_id', 'row', 'number', name='uq_seat_room'),)

class Showtime(Base):
    __tablename__ = "showtimes"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    movie_id = Column(String(36), ForeignKey("movies.id"), nullable=False)
    room_id = Column(String(36), ForeignKey("cinema_rooms.id"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    price = Column(Float, nullable=False) 
    
    movie = relationship("Movie")
    room = relationship("CinemaRoom", back_populates="showtimes")
    bookings = relationship("SeatBooking", back_populates="showtime")


class Booking(Base):
    __tablename__ = "bookings"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    showtime_id = Column(String(36), ForeignKey("showtimes.id"), nullable=False)
    
    total_amount = Column(Float, nullable=False)
    status = Column(Enum(BookingStatus), default=BookingStatus.PENDING, nullable=False)
    payment_method = Column(String(50), nullable=True)
    transaction_reference = Column(String(100), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    showtime = relationship("Showtime")
    tickets = relationship("SeatBooking", back_populates="booking")
    
class SeatBooking(Base):
    __tablename__ = "seat_bookings"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    
    booking_id = Column(String(36), ForeignKey("bookings.id"), nullable=False)
    seat_id = Column(String(36), ForeignKey("seats.id"), nullable=False)
    showtime_id = Column(String(36), ForeignKey("showtimes.id"), nullable=False)
    
    price = Column(Float, nullable=False)
    qr_code_url = Column(String(500), nullable=True)
    is_used = Column(Boolean, default=False)
    
    booking = relationship("Booking", back_populates="tickets")
    seat = relationship("Seat", back_populates="bookings")
    showtime = relationship("Showtime", back_populates="bookings")
    
    
    
class User(Base):
    __tablename__ = "users"

   
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone_number = Column(String(20), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=True)
    google_id = Column(String(255), nullable=True)
    
  
    full_name = Column(String(100), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    
    
    role = Column(Enum(UserRole), default=UserRole.CUSTOMER, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
  
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)