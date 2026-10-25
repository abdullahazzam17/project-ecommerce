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

engine = create_engine(
    DATABASE_URL,
    pool_size=10,         # 10 koneksi tetap — cukup untuk banjir tanpa membuat koneksi baru di tengah jalan
    max_overflow=0,       # TANPA overflow: tidak ada lonjakan pembuatan koneksi yang menghambat Supavisor
    pool_pre_ping=True,   # deteksi koneksi mati otomatis (anti error 500 saat banjir)
    pool_recycle=1800,    # daur ulang tiap 30 menit — hindari pembuatan ulang massal saat lalu lintas ramai
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()