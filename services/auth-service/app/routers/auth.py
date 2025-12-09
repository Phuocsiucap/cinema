from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
import jwt
import datetime
from dotenv import load_dotenv
import os

from authlib.integrations.starlette_client import OAuth
import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update
from app import schemas, crud, database
from app.models import User
from starlette.requests import Request

load_dotenv()
router = APIRouter()


oauth = OAuth()
oauth.register(
    name='google',
    client_id=os.getenv("GOOGLE_CLIENT_ID", "YOUR_GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET", "YOUR_GOOGLE_CLIENT_SECRET"),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)

oauth.register(
    name='github',
    client_id=os.getenv("GITHUB_CLIENT_ID", "YOUR_GITHUB_CLIENT_ID"),
    client_secret=os.getenv("GITHUB_CLIENT_SECRET", "YOUR_GITHUB_CLIENT_SECRET"),
    access_token_url='https://github.com/login/oauth/access_token',
    authorize_url='https://github.com/login/oauth/authorize',
    api_base_url='https://api.github.com/',
    client_kwargs={'scope': 'user:email read:user'},
)


oauth.register(
    name='microsoft',
    client_id=os.getenv("MICROSOFT_CLIENT_ID", "YOUR_MICROSOFT_CLIENT_ID"),
    client_secret=os.getenv("MICROSOFT_CLIENT_SECRET", "YOUR_MICROSOFT_CLIENT_SECRET"),
    server_metadata_url='https://login.microsoftonline.com/consumers/v2.0/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile',
    }
)
   
   
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
    
    return await create_token(db, db_user, datetime.timedelta(minutes=int(os.getenv("JWT_EXPIRE_MINUTES", 30))))

@router.get("/google", response_model=schemas.AuthResponse)
async def login_google(request: Request):
    redirect_uri = request.url_for('auth_google_callback')
    
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/google/callback")
async def auth_google_callback(request: Request, db: AsyncSession = Depends(database.get_db)):
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get('userinfo')
        
        if not user_info:
            raise HTTPException(status_code=400, detail="Failed to get user info from Google")
        print("UerInfo: ", user_info)
        email = user_info.get('email')
        
        user = await crud.get_user_by_email(db, email)
        if user:
            if user.google_id is None:
                user.google_id = str(user_info.get('sub'))
                await db.commit()
                await db.refresh(user)
                
        if not user:
            new_user = User(
                id=uuid.uuid4(),  
                full_name=user_info.get('name'),
                email=email,
                phone_number=None,
                hashed_password="", 
                google_id=user_info.get('sub'), 
                avatar_url=user_info.get('picture'),
                is_active=True,
                is_verified=True,
            )
            db.add(new_user)
            await db.commit()
            await db.refresh(new_user)
            user = new_user
        
        token_data = await create_token(db, user, datetime.timedelta(minutes=int(os.getenv("JWT_EXPIRE_MINUTES", 30))))
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        return RedirectResponse(url=f"{frontend_url}/auth/callback?token={token_data.token}")
        
    except HTTPException:
        
        raise
    except Exception as e:
        print(f"Auth error: {str(e)}") 
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        return RedirectResponse(url=f"{frontend_url}/login?error=auth_failed")

@router.get("/github", response_model=schemas.AuthResponse)
async def login_github(request: Request):
    redirect_uri = request.url_for('auth_github_callback')
    return await oauth.github.authorize_redirect(request, redirect_uri)

@router.get("/github/callback")
async def auth_github_callback(request: Request, db: AsyncSession = Depends(database.get_db)):
    try:
        token = await oauth.github.authorize_access_token(request)
        resp = await oauth.github.get('user', token=token)
        user_info = resp.json()
        
        github_id = str(user_info.get('id'))
        name = user_info.get('name') or user_info.get('login')
        email = user_info.get('email')

        if not email:
            emails_resp = await oauth.github.get('user/emails', token=token)
            emails_info = emails_resp.json()
            primary_email_info = next(
                (e for e in emails_info if e.get('primary') is True and e.get('verified') is True), 
                None
            )
            
            # print("emails_info: ", emails_info)
            # print("primary_email_info: ", primary_email_info)
            
            if primary_email_info:
                email = primary_email_info['email']
            else:
                raise HTTPException(
                    status_code=400, 
                    detail="GitHub user has private email and no verifiable public email."
                )
        user = await crud.get_user_by_email(db, email)
        if user:
            if user.github_id is None:
                user.github_id = str(user_info.get('id'))
                await db.commit()
                await db.refresh(user)
        if not user:
            new_user = User(
                id=uuid.uuid4(),
                full_name=name,
                email=email,
                phone_number=None,
                hashed_password="",
                github_id=str(user_info.get('id')),
                avatar_url=user_info.get('avatar_url'),
                is_active=True,
                is_verified=True,
            )
            db.add(new_user)
            await db.commit()
            await db.refresh(new_user)
            user = new_user
        token_data = await create_token(db, user, datetime.timedelta(minutes=int(os.getenv("JWT_EXPIRE_MINUTES", 30))))
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        return RedirectResponse(url=f"{frontend_url}/auth/callback?token={token_data.token}")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Auth error: {str(e)}") 
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        return RedirectResponse(url=f"{frontend_url}/login?error=auth_failed")
    
@router.get("/microsoft", response_model=schemas.AuthResponse)
async def login_microsoft(request: Request):
    """API chuyển hướng người dùng sang Microsoft để đăng nhập."""
    redirect_uri = request.url_for('auth_microsoft_callback')
    return await oauth.microsoft.authorize_redirect(request, redirect_uri)

@router.get("/microsoft/callback")
async def auth_microsoft_callback(request: Request, db: AsyncSession = Depends(database.get_db)):
    """API xử lý kết quả trả về từ Microsoft (Callback)"""
    try:
        # 1. Lấy Access Token và User Info
        token = await oauth.microsoft.authorize_access_token(request)
        
        # Microsoft (OIDC) thường trả về thông tin người dùng ngay trong token/userinfo
        user_info = token.get('userinfo')
        
        if not user_info:
             raise HTTPException(status_code=400, detail="Failed to get user info from Microsoft")

        # 2. LẤY DỮ LIỆU MICROSOFT (Key: 'sub' là ID, 'upn' hoặc 'email' là email)
        email = user_info.get('email') or user_info.get('upn') 
        microsoft_id = str(user_info.get('sub')) 
        name = user_info.get('name') or user_info.get('preferred_username')
        
        if not email:
            raise HTTPException(status_code=400, detail="Microsoft email not available.")

        # --- 3. UPSERT LOGIC (Tìm kiếm hoặc Tạo mới) ---
        user = await crud.get_user_by_email(db, email)
        
        if user:
            if user.microsoft_id is None:
                user.microsoft_id = microsoft_id
                await db.commit()
                await db.refresh(user)
        else:
            # TẠO MỚI (INSERT)
            new_user = User(
                id=uuid.uuid4(),
                full_name=name,
                email=email,
                hashed_password="",
                microsoft_id=microsoft_id, 
                is_active=True,
                is_verified=True,
            )
            db.add(new_user)
            await db.commit()
            await db.refresh(new_user)
            user = new_user
        
        # 4. TẠO VÀ TRẢ VỀ JWT TOKEN CỦA HỆ THỐNG
        token_data = await create_token(db, user, datetime.timedelta(minutes=int(os.getenv("JWT_EXPIRE_MINUTES", 30))))
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        return RedirectResponse(url=f"{frontend_url}/auth/callback?token={token_data.token}")

    except HTTPException:
        raise
    except Exception as e:
        print(f"Microsoft auth error: {str(e)}")
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        return RedirectResponse(url=f"{frontend_url}/login?error=auth_failed")
    
@router.post("/logout")
async def logout(auth: schemas.AuthLogout, db: AsyncSession = Depends(database.get_db)):
    await crud.revoke_token(db, auth.token)
    return {"message": "Token revoked successfully"}

@router.post("/register", status_code=201)
async def register(auth: schemas.AuthRegister, db: AsyncSession = Depends(database.get_db)):
    db_user = await crud.get_user_by_email(db, auth.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    await crud.create_user(db=db, user=auth)
    return {"message": "User created successfully"}

@router.post("/verify-account")
async def verify_account(request: Request, db: AsyncSession = Depends(database.get_db)):
    """Verify user account by setting is_verified = true"""
    # Get user_id from x-user-id header (set by API Gateway)
    user_id = request.headers.get("x-user-id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in headers")

    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    # Update user verification status
    db_user = await crud.get_user(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if db_user.is_verified:
        return {"message": "Account already verified", "is_verified": True}

    # Update is_verified to True
    update_data = {"is_verified": True}
    updated_user = await crud.update_user(db, user_id, schemas.UserUpdate(**update_data))

    if not updated_user:
        raise HTTPException(status_code=500, detail="Failed to update verification status")

    return {
        "message": "Account verified successfully",
        "is_verified": True,
        "user": {
            "id": str(updated_user.id),
            "email": updated_user.email,
            "full_name": updated_user.full_name,
            "is_verified": updated_user.is_verified
        }
    }

