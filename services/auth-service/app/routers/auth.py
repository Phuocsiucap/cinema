from fastapi import APIRouter, Depends, HTTPException
import jwt
import datetime
from dotenv import load_dotenv
import os
import httpx
import uuid
from google.oauth2 import id_token
from google.auth.transport import requests
from starlette.concurrency import run_in_threadpool

from sqlalchemy.ext.asyncio import AsyncSession
from app import schemas, crud, database
from app.models import User

load_dotenv()
router = APIRouter()

async def create_token(db: AsyncSession, db_user, expires_delta: datetime.timedelta):
    """Create JWT token and save to database"""
    exp = datetime.datetime.utcnow() + expires_delta
    payload = {
        "sub": str(db_user.id),
        "exp": exp,
        "iat": datetime.datetime.utcnow(),
        "nbf": datetime.datetime.utcnow(),
        "email": db_user.email,
        "full_name": db_user.full_name,
        "role": db_user.role.value
    }
    token = jwt.encode(payload, os.getenv("JWT_SECRET", "abcd1234"), algorithm=os.getenv("ALGORITHM", "HS256"))

    return await crud.save_token(db, db_user.id, token, exp)

@router.post("/login", response_model=schemas.AuthResponse)
async def login(auth: schemas.AuthLogin, db: AsyncSession = Depends(database.get_db)):
    db_user = await crud.get_user_by_email(db, auth.email)
    if not db_user:
        raise HTTPException(status_code=400, detail="Email or password incorrect")
    if not crud.verify_password(auth.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Email or password incorrect")

    token_data = await create_token(db, db_user, datetime.timedelta(minutes=int(os.getenv("JWT_EXPIRE_MINUTES", 30))))
    
    return schemas.AuthResponse(
        access_token=token_data.token,
        token_type="bearer",
        user=schemas.UserResponse(
            id=str(db_user.id),
            email=db_user.email,
            full_name=db_user.full_name,
            role=db_user.role,
            avatar_url=db_user.avatar_url,
            is_verified=db_user.is_verified,
            is_active=db_user.is_active
        )
    )

@router.post("/google/token", response_model=schemas.AuthResponse)
async def google_login(data: schemas.TokenSchema, db: AsyncSession = Depends(database.get_db)):
    try:
        client_id = os.getenv("GOOGLE_CLIENT_ID")
        if not client_id:
            raise HTTPException(status_code=500, detail="Server misconfiguration: Missing GOOGLE_CLIENT_ID")

        # 1. Xác thực ID Token (Chạy trong threadpool để tránh block async loop)
        idinfo = await run_in_threadpool(
            id_token.verify_oauth2_token,
            data.token,
            requests.Request(),
            client_id
        )

        # Kiểm tra email đã xác thực từ phía Google chưa
        if not idinfo.get("email_verified"):
             raise HTTPException(status_code=400, detail="Google account email is not verified")

        # 2. Lấy thông tin user
        user_email = idinfo['email']
        user_name = idinfo.get('name')
        user_picture = idinfo.get('picture')
        google_id = str(idinfo.get('sub'))

        # 3. Kiểm tra user trong DB
        user = await crud.get_user_by_email(db, user_email)

        if user:
            # Nếu user đã tồn tại, cập nhật avatar nếu chưa có hoặc google_id
            if not user.google_id:
                user.google_id = google_id
            
            # Tùy chọn: Update avatar nếu user chưa có avatar
            if not user.avatar_url and user_picture:
                user.avatar_url = user_picture
                
            await db.commit()
            await db.refresh(user)
        else:
            # Tạo user mới
            new_user = User(
                id=uuid.uuid4(),
                full_name=user_name,
                email=user_email,
                google_id=google_id,
                avatar_url=user_picture,
                is_active=True,
                is_verified=True, # Google đã verify email rồi
                hashed_password=""
            )
            db.add(new_user)
            await db.commit()
            await db.refresh(new_user)
            user = new_user

        # 4. Tạo JWT token
        token_data = await create_token(db, user, datetime.timedelta(minutes=int(os.getenv("JWT_EXPIRE_MINUTES", 30))))
        
        return schemas.AuthResponse(
            access_token=token_data.token,
            token_type="bearer",
            user=schemas.UserResponse(
                id=str(user.id),
                email=user.email,
                full_name=user.full_name,
                role=user.role,
                avatar_url=user.avatar_url,
                is_verified=user.is_verified,
                is_active=user.is_active
            )
        )

    except ValueError as e:
        # Token hết hạn hoặc không hợp lệ
        raise HTTPException(status_code=401, detail=f"Invalid Google Token: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Login failed: {str(e)}")

@router.post("/github", response_model=schemas.AuthResponse)
async def github_login(data: schemas.GithubLoginSchema, db: AsyncSession = Depends(database.get_db)):
    try:
        # 1. Đổi Code lấy Access Token
        async with httpx.AsyncClient() as client:
            token_res = await client.post(
                "https://github.com/login/oauth/access_token",
                headers={"Accept": "application/json"},
                params={
                    "client_id": os.getenv("GITHUB_CLIENT_ID", "YOUR_GITHUB_CLIENT_ID"),
                    "client_secret": os.getenv("GITHUB_CLIENT_SECRET", "YOUR_GITHUB_CLIENT_SECRET"),
                    "code": data.code
                }
            )
            token_data = token_res.json()

            if "error" in token_data:
                raise HTTPException(status_code=400, detail="Invalid GitHub Code")

            access_token = token_data["access_token"]

            # 2. Lấy thông tin User
            user_res = await client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            user_info = user_res.json()

            # 3. Lấy Email (GitHub có thể ẩn email, cần gọi API riêng nếu email là private)
            email = user_info.get("email")
            if not email:
                email_res = await client.get(
                    "https://api.github.com/user/emails",
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                # Lấy email chính (primary)
                emails = email_res.json()
                primary_email = next((e for e in emails if e["primary"]), None)
                email = primary_email["email"] if primary_email else None

            if not email:
                raise HTTPException(status_code=400, detail="Unable to get email from GitHub")

            # 4. Kiểm tra user trong DB
            user = await crud.get_user_by_email(db, email)

            if user:
                # Update github_id nếu chưa có
                if not user.github_id:
                    user.github_id = str(user_info.get('id'))
                    await db.commit()
                    await db.refresh(user)
            else:
                # Tạo user mới
                new_user = User(
                    id=uuid.uuid4(),
                    full_name=user_info.get('name') or user_info.get('login'),
                    email=email,
                    github_id=str(user_info.get('id')),
                    avatar_url=user_info.get('avatar_url'),
                    is_active=True,
                    is_verified=True,
                    hashed_password=""  # OAuth không cần mật khẩu
                )
                db.add(new_user)
                await db.commit()
                await db.refresh(new_user)
                user = new_user

            # 5. Tạo JWT token
            token_data = await create_token(db, user, datetime.timedelta(minutes=int(os.getenv("JWT_EXPIRE_MINUTES", 30))))
            print(f"GitHub login successful for user {user.email}, token: {token_data.token[:20]}...")
            
            # Trả về cả token và user info
            return schemas.AuthResponse(
                access_token=token_data.token,
                token_type="bearer",
                user=schemas.UserResponse(
                    id=str(user.id),
                    email=user.email,
                    full_name=user.full_name,
                    role=user.role,
                    avatar_url=user.avatar_url,
                    is_verified=user.is_verified,
                    is_active=user.is_active
                )
            )

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"GitHub OAuth failed: {str(e)}")

@router.post("/register", status_code=201)
async def register(auth: schemas.AuthRegister, db: AsyncSession = Depends(database.get_db)):
    db_user = await crud.get_user_by_email(db, auth.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    await crud.create_user(db=db, user=auth)
    return {"message": "User registered successfully"}

@router.post("/logout")
async def logout(auth: schemas.AuthLogout, db: AsyncSession = Depends(database.get_db)):
    await crud.revoke_token(db, auth.token)
    return {"message": "Token revoked successfully"}