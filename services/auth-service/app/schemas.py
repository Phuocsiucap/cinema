from pydantic import BaseModel, EmailStr
from typing import Optional, List
from enum import Enum

class UserRole(str, Enum):
    CUSTOMER = "customer"
    ADMIN = "admin"
    SELLER = "seller"

class AuthBase(BaseModel):
    email: EmailStr

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: UserRole
    avatar_url: Optional[str] = None
    is_verified: bool

    class Config:
        from_attributes = True

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

    class Config:
        from_attributes = True

class AuthLogin(AuthBase):
    password: str

class AuthRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone_number: Optional[str] = None

    class Config:
        from_attributes = True

class AuthLogout(BaseModel):
    token: str

class TokenSchema(BaseModel):
    token: str

class GithubLoginSchema(BaseModel):
    code: str

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone_number: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role: Optional[UserRole] = UserRole.CUSTOMER

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None
    role: UserRole
    is_active: bool
    is_verified: bool

    class Config:
        from_attributes = True

class PaginatedUsersResponse(BaseModel):
    users: List[UserResponse]
    total: int
    skip: int
    limit: int