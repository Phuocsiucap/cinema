from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import AsyncAdaptedQueuePool
import os
import ssl
from dotenv import load_dotenv

load_dotenv()

# Change from postgresql:// to postgresql+asyncpg://
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
    # Switch to asyncpg driver
    if DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
    
    # Remove sslmode from URL as asyncpg doesn't support it
    if "sslmode=" in DATABASE_URL:
        # Split and remove sslmode parameter
        import re
        DATABASE_URL = re.sub(r'[\?&]sslmode=[^&]*', '', DATABASE_URL)
        # Clean up URL if there are leftover ? or & characters
        DATABASE_URL = DATABASE_URL.replace('?&', '?').rstrip('?').rstrip('&')

# Async engine với connection pool
engine = create_async_engine(
    DATABASE_URL,
    poolclass=AsyncAdaptedQueuePool,
    pool_size=10,           # Số connection giữ sẵn
    max_overflow=20,        # Số connection tối đa khi cần
    pool_timeout=30,        # Timeout khi chờ connection
    pool_recycle=1800,      # Recycle connection sau 30 phút
    pool_pre_ping=True,     # Kiểm tra connection còn sống không
    echo=False,
)

# Async session maker
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()