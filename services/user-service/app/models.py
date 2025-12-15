import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Enum
from app.database import Base

class UserRole(enum.Enum):
    CUSTOMER = "customer"
    ADMIN = "admin"
    SELLER = "seller"

class User(Base):
    __tablename__ = "users"

    # ID as String (stores UUID as text)
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    
    # Login information
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone_number = Column(String(20), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=True)
    google_id = Column(String(255), nullable=True)
    
    # Personal information
    full_name = Column(String(100), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    
    # Permissions & Status
    role = Column(Enum(UserRole), default=UserRole.CUSTOMER, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # Audit logs
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)