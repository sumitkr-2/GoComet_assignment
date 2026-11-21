import pytest
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
from app.database import Base, get_db
from app.main import app
from app.models.user import User, Supplier, UserRole
from app.core.security import get_password_hash, create_access_token

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def buyer_user(db_session):
    user = User(
        name="Test Buyer",
        email="buyer_test@example.com",
        password_hash=get_password_hash("Password@123"),
        role=UserRole.BUYER,
        created_at=datetime.utcnow()
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def buyer_token(buyer_user):
    return create_access_token(subject=buyer_user.id)

@pytest.fixture
def suppliers(db_session):
    supps = []
    for i in range(1, 4):
        u = User(
            name=f"Supplier User {i}",
            email=f"supp{i}@example.com",
            password_hash=get_password_hash("Password@123"),
            role=UserRole.SUPPLIER,
            created_at=datetime.utcnow()
        )
        db_session.add(u)
        db_session.flush()
        s = Supplier(
            user_id=u.id,
            company_name=f"Supplier Corp {i}",
            contact_phone=f"123456789{i}",
            created_at=datetime.utcnow()
        )
        db_session.add(s)
        db_session.flush()
        supps.append((u, s))
    db_session.commit()
    return supps
