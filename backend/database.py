import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Paksa load_dotenv membaca file .env tepat di folder backend ini
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.getenv("DATABASE_URL")

# Validasi jika DATABASE_URL masih tidak terbaca
if not DATABASE_URL:
    raise ValueError("ERROR: DATABASE_URL tidak ditemukan di file .env! Cek kembali file .env kamu.")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()