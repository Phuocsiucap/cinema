from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import AsyncAdaptedQueuePool
import os
import ssl
from dotenv import load_dotenv

load_dotenv()

# Đổi từ postgresql:// sang postgresql+asyncpg://
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    DATABASE_URL = "postgresql+asyncpg://neondb_owner:npg_D0UhsYXfC5qz@ep-frosty-brook-a1pvww8v4mjekqtvh@ep-frosty-brook-a1pvww8v-pooler.ap-southeast-1.aws.neon.tech/neondb"

if DATABASE_URL:
    # Chuyển sang asyncpg driver
    if DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
    
    # Xóa sslmode từ URL vì asyncpg không hỗ trợ
    if "sslmode=" in DATABASE_URL:
        # Tách và xóa sslmode parameter
        import re
        DATABASE_URL = re.sub(r'[\?&]sslmode=[^&]*', '', DATABASE_URL)
        # Clean up URL nếu còn dấu ? hoặc & thừa
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