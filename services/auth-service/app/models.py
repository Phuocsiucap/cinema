import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Enum, text
from app.database import Base

class UserRole(enum.Enum):
    CUSTOMER = "customer"
    ADMIN = "admin"
    SELLER = "seller"

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone_number = Column(String(20), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=True)
    google_id = Column(String(255), nullable=True)
    github_id = Column(String(255), nullable=True)
    microsoft_id = Column(String(255), nullable=True)
    facebook_id = Column(String(255), nullable=True)
    
    full_name = Column(String(100), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.CUSTOMER, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Token(Base):
    __tablename__ = "tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey('users.id'), nullable=False)
    token = Column(String(512), unique=True, index=True, nullable=False)
    is_revoked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expired_at = Column(DateTime, nullable=False)
    