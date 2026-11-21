from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole
    company_name: Optional[str] = None
    contact_phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    name: str
    email: str
    role: UserRole
    supplier_id: Optional[int] = None
    company_name: Optional[str] = None

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    supplier_id: Optional[int] = None
    company_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
