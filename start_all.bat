@echo off
REM ================================================================
REM Script khởi chạy tất cả services cho Cinema Booking System
REM ================================================================

echo ============================================================
echo        CINEMA BOOKING SYSTEM - START ALL SERVICES
echo ============================================================
echo.

REM Lưu thư mục gốc
set ROOT_DIR=%~dp0

REM Kiểm tra Python
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python khong duoc cai dat hoac khong co trong PATH
    pause
    exit /b 1
)

REM Kiểm tra Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js khong duoc cai dat hoac khong co trong PATH
    pause
    exit /b 1
)

echo [INFO] Dang khoi dong cac services...
echo.

REM ================================================================
REM 1. Start User Service (Port 8001)
REM ================================================================
REM echo [1/6] Starting User Service (Port 8001)...
REM start "User Service - Port 8001" cmd /k "cd /d %ROOT_DIR%services\user-service\app && python main.py"
REM timeout /t 2 /nobreak >nul

REM ================================================================
REM 2. Start Auth Service (Port 8002)
REM ================================================================
echo [2/6] Starting Auth Service (Port 8002)...
start "Auth Service - Port 8002" cmd /k "cd /d %ROOT_DIR%services\auth-service && uvicorn app.main:app --reload --host 0.0.0.0 --port 8002"
timeout /t 2 /nobreak >nul

REM ================================================================
REM 3. Start Cinema Service (Port 8003)
REM ================================================================
echo [3/6] Starting Cinema Service (Port 8003)...
start "Cinema Service - Port 8003" cmd /k "cd /d %ROOT_DIR%services\cinema-service && uvicorn app.main:app --reload --host 0.0.0.0 --port 8003"
timeout /t 2 /nobreak >nul

REM ================================================================
REM 4. Start Seat Booking Service (Port 8004)
REM ================================================================
echo [4/6] Starting Seat Booking Service (Port 8004)...
start "Seat Booking Service - Port 8004" cmd /k "cd /d %ROOT_DIR%services\seatbooking-service && node src/app.js"
timeout /t 2 /nobreak >nul

REM ================================================================
REM 5. Start API Gateway (Port 8000)
REM ================================================================
echo [5/6] Starting API Gateway (Port 8000)...
start "API Gateway - Port 8000" cmd /k "cd /d %ROOT_DIR%services\api_gateway && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 2 /nobreak >nul

REM ================================================================
REM 6. Start Frontend (Vite - Port 5173)
REM ================================================================
echo [6/6] Starting Frontend (Vite Dev Server - Port 5173)...
start "Frontend - Port 5173" cmd /k "cd /d %ROOT_DIR%cinema_frontend && npm run dev"

echo.
echo ============================================================
echo        TAT CA SERVICES DA DUOC KHOI DONG!
echo ============================================================
echo.
echo  Services dang chay:
echo  -----------------------------------------------------------
echo  [1] User Service:        http://localhost:8001
echo  [2] Auth Service:        http://localhost:8002
echo  [3] Cinema Service:      http://localhost:8003
echo  [4] Seat Booking Service: http://localhost:8004
echo  [5] API Gateway:         http://localhost:8000
echo  [6] Frontend:            http://localhost:5173
echo  -----------------------------------------------------------
echo.
echo  De dung tat ca services, dong tat ca cua so terminal
echo  hoac chay file: stop_all.bat
echo.
echo ============================================================

pause
