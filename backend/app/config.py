import os
from pydantic_settings import BaseSettings

def get_default_db_url() -> str:
    env_url = os.getenv("DATABASE_URL")
    if env_url:
        return env_url
    if os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
        return "sqlite:////tmp/british_auction.db"
    return "sqlite:///./british_auction.db"

class Settings(BaseSettings):
    PROJECT_NAME: str = "British Auction RFQ System"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "cocomet-british-auction-secret-key-2026-production-ready")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    DATABASE_URL: str = get_default_db_url()

    class Config:
        case_sensitive = True

settings = Settings()
