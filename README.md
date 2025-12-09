# Cinema E-commerce Microservices

A microservices-based cinema ticket booking system built with FastAPI, React, and Node.js.

## Architecture

- **API Gateway** (FastAPI) - Routes requests to appropriate services
- **Auth Service** (FastAPI) - Authentication, authorization, and user management
- **Cinema Service** (FastAPI) - Movie and cinema management
- **Seat Booking Service** (Node.js) - Real-time seat booking with WebSockets
- **Frontend** (React/TypeScript) - User interface

## Prerequisites

- Docker and Docker Compose
- At least 4GB RAM available
- External PostgreSQL database
- External Redis instance

## Environment Setup

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update the `.env` file with your actual database and service credentials:
```bash
# Required environment variables
DATABASE_URL=postgresql://username:password@host:port/database_name
REDIS_URL=redis://host:port
SECRET_KEY=your-secret-key-here
JWT_SECRET=your-secret-key-here

# Optional: OAuth, SMTP, Cloudinary settings
GOOGLE_CLIENT_ID=your-google-client-id
GITHUB_CLIENT_ID=your-github-client-id
MICROSOFT_CLIENT_ID=your-microsoft-client-id
SMTP_SERVER=smtp.gmail.com
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
# ... etc (see .env.example for all variables)
```

3. Validate your environment variables:
```bash
chmod +x check_env.sh
./check_env.sh
```

## Quick Start

1. Clone the repository
2. Navigate to the project directory
3. Set up environment variables (see Environment Setup above)
4. Run the application:

```bash
docker-compose up --build
```

The application will be available at:
- API Gateway: http://localhost:8000
- Auth Service: http://localhost:8002
- Cinema Service: http://localhost:8003
- Seat Booking Service: http://localhost:8004

## Services

### API Gateway
- Port: 8000
- Routes all API requests to appropriate microservices
- Handles JWT authentication

### Auth Service
- Port: 8002
- Handles user authentication (login/register)
- Manages user profiles and data
- Supports Google OAuth

### Cinema Service
- Port: 8003
- Manages cinemas, movies, showtimes

### Seat Booking Service
- Port: 8004
- Real-time seat booking with Socket.IO
- Uses Redis for session management

### Frontend
- Port: 3000
- React application with TypeScript
- Responsive UI with Tailwind CSS

## Database

- PostgreSQL 15
- Redis 7 (for caching and sessions)

## Environment Variables

Create a `.env` file in the root directory with:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/cinema_db

# JWT
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Service URLs
AUTH_SERVICE_URL=http://localhost:8002
CINEMA_SERVICE_URL=http://localhost:8003
SEATBOOKING_SERVICE_URL=http://localhost:8004

# Ports
GATEWAY_PORT=8000
```

## Development

To run individual services for development:

```bash
# API Gateway
cd services/api_gateway && pip install -r requirements.txt && uvicorn app.main:app --reload

# Auth Service
cd services/auth-service && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8002

# Cinema Service
cd services/cinema-service && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8003

# Seat Booking Service
cd seatbooking-service && npm install && npm run dev

# Frontend
cd cinema_frontend && npm install && npm run dev
```

## API Documentation

Once running, API documentation is available at:
- API Gateway: http://localhost:8000/docs
- Auth Service: http://localhost:8002/docs
- Cinema Service: http://localhost:8003/docs"# cinema-" 
"# cinema" 
"# cinema" 
