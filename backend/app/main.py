from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routes import (
    auth_router,
    rfqs_router,
    quotations_router,
    rankings_router,
    activity_router,
    dashboard_router,
)
import app.models  # ensure all models registered
from app.seed import ensure_seeded

# Ensure database tables and demo seed data on module import
ensure_seeded()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database tables and demo accounts on application startup
    ensure_seeded()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers with /api prefix
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(rfqs_router, prefix=settings.API_V1_STR)
app.include_router(quotations_router, prefix=settings.API_V1_STR)
app.include_router(rankings_router, prefix=settings.API_V1_STR)
app.include_router(activity_router, prefix=settings.API_V1_STR)
app.include_router(dashboard_router, prefix=settings.API_V1_STR)

# Also include Routers without /api prefix for proxies/rewrites that strip the prefix
app.include_router(auth_router)
app.include_router(rfqs_router)
app.include_router(quotations_router)
app.include_router(rankings_router)
app.include_router(activity_router)
app.include_router(dashboard_router)

@app.get("/health", tags=["Health"])
@app.get(f"{settings.API_V1_STR}/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": "1.0.0"
    }

@app.on_event("startup")
def on_startup():
    ensure_seeded()
