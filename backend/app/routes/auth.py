from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, Supplier, UserRole
from app.schemas.auth import UserRegister, UserLogin, Token, UserOut
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        role=user_in.role
    )
    db.add(user)
    db.flush()

    supplier_id = None
    company_name = None
    if user.role == UserRole.SUPPLIER:
        c_name = user_in.company_name or f"{user.name}'s Logistics"
        supplier = Supplier(
            user_id=user.id,
            company_name=c_name,
            contact_phone=user_in.contact_phone
        )
        db.add(supplier)
        db.flush()
        supplier_id = supplier.id
        company_name = supplier.company_name

    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id)
    return Token(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        supplier_id=supplier_id,
        company_name=company_name
    )

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    supplier_id = None
    company_name = None
    if user.role == UserRole.SUPPLIER and user.supplier_profile:
        supplier_id = user.supplier_profile.id
        company_name = user.supplier_profile.company_name

    token = create_access_token(subject=user.id)
    return Token(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        supplier_id=supplier_id,
        company_name=company_name
    )

@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    supplier_id = current_user.supplier_profile.id if current_user.supplier_profile else None
    company_name = current_user.supplier_profile.company_name if current_user.supplier_profile else None
    return UserOut(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        supplier_id=supplier_id,
        company_name=company_name,
        created_at=current_user.created_at
    )
