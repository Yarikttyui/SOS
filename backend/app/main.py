"""
Main FastAPI application
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import time
import os

from app.core.config import settings
from app.core.database import sync_engine, Base
from app.api.v1 import auth, sos, users, geolocation, teams, notifications, analytics, websocket, ai
from app.middleware.error_handler import error_handler_middleware

# Create tables - DISABLED: Tables are created via create_mysql_database.py
# Base.metadata.create_all(bind=sync_engine)

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Интеллектуальная система поддержки спасательных операций",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Middleware
app.middleware("http")(error_handler_middleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development (including file:// protocol)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)


# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


# Mount static files
if os.path.exists("uploads"):
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(sos.router, prefix="/api/v1/sos", tags=["SOS Alerts"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(geolocation.router, prefix="/api/v1/geolocation", tags=["Geolocation"])
app.include_router(teams.router, prefix="/api/v1/teams", tags=["Rescue Teams"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["Notifications"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(websocket.router, prefix="/api/v1", tags=["WebSocket"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["AI Analysis"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Rescue System API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "status": "operational"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "timestamp": time.time()
    }


@app.get("/api/v1/ping")
async def ping():
    """Ping endpoint"""
    return {"ping": "pong"}


@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Rescue System API",
        "version": settings.APP_VERSION
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
