from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.core.config import DATABASE_URL

# Create the SQLAlchemy engine dynamically
# connect_args={"check_same_thread": False} is only required/supported for SQLite
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL, connect_args=connect_args
)

# SessionLocal class will be instantiated to create individual database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for SQLAlchemy models to inherit from
Base = declarative_base()

# Dependency generator to get DB session and ensure it gets closed after request lifecycle
def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
