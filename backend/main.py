import hashlib
import hmac
import os
import re
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation
from typing import List, Optional

import midtransclient
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security.utils import get_authorization_scheme_param
from passlib.context import CryptContext
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import func, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

import models
from auth_tokens import issue_user_token, verify_user_token
from database import engine, get_db
from rate_limit import allow, client_key

load_dotenv()

# Token user ditandatangani dengan secret ini. Di production WAJIB diset.
if not os.getenv("USER_TOKEN_SECRET"):
    os.environ["USER_TOKEN_SECRET"] = secrets.token_urlsafe(48)
    print("WARNING: USER_TOKEN_SECRET belum diset; token user tidak valid setelah restart.")

# create_all dibungkus agar API tetap bisa start dan health check melaporkan DB down.
try:
    models.Base.metadata.create_all(bind=engine)
except Exception as exc:
    print("WARNING: create_all gagal (database belum siap):", str(exc)[:160])

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-warm pool: buka koneksi satu per satu agar Supavisor tidak menolak burst.
    conns = []
    for _ in range(10):
        try:
            conns.append(engine.connect())
        except Exception as e:
            print("Pre-warm pool terputus (lanjut tanpa pre-warm penuh):", str(e)[:120])
            break
    for conn in conns:
        conn.close()
    yield

app = FastAPI(title="Zoom Custom E-Commerce API", lifespan=lifespan)


def _csv_env(name: str) -> List[str]:
    return [item.strip() for item in os.getenv(name, "").split(",") if item.strip()]


_default_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.0.1:3000",
]
_allowed_origins = list(dict.fromkeys(_default_origins + _csv_env("FRONTEND_ORIGINS")))
_origin_regex = os.getenv(
    "FRONTEND_ORIGIN_REGEX",
    r"https://([a-z0-9-]+\.)*(vercel\.app|trycloudflare\.com|ngrok-free\.app|ngrok\.app)",
) or None

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_origin_regex=_origin_regex,
    # Auth memakai Authorization Bearer, bukan cookie, jadi credentials tidak perlu.
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(SQLAlchemyError)
async def handle_database_error(request: Request, exc: SQLAlchemyError):
    # 503 (bukan 500 mentah) agar response tetap melewati middleware CORS.
    print("DB error:", type(exc).__name__, str(exc)[:160])
    return JSONResponse(status_code=503, content={"detail": "Database tidak terjangkau"})

snap = midtransclient.Snap(
    is_production=False,
    server_key=os.getenv("MIDTRANS_SERVER_KEY"),
    client_key=os.getenv("MIDTRANS_CLIENT_KEY")
)

# Inisialisasi Bcrypt untuk password hashing & salting otomatis
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# --- ADMIN AUTH (TOKEN SERVER-SIDE, DIVERIFIKASI PER REQUEST) ---
# Token admin disimpan di .env (tidak pernah di-commit). Jika env kosong,
# token acak digenerate per restart sehingga tidak bisa ditebak.
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN") or secrets.token_hex(32)

def verify_admin(request: Request) -> None:
    """Dependency: tolak request admin tanpa token yang sah (401)."""
    scheme, param = get_authorization_scheme_param(request.headers.get("Authorization", ""))
    if scheme.lower() != "bearer" or not secrets.compare_digest(param, ADMIN_TOKEN):
        raise HTTPException(
            status_code=401,
            detail="Akses admin ditolak: token tidak valid atau tidak ada."
        )


def get_current_user(request: Request, db: Session = Depends(get_db)) -> models.User:
    """Dependency checkout: token user harus valid dan belum kedaluwarsa."""
    scheme, param = get_authorization_scheme_param(request.headers.get("Authorization", ""))
    if scheme.lower() != "bearer" or not param:
        raise HTTPException(status_code=401, detail="Silakan login terlebih dahulu.")
    user_id = verify_user_token(param)
    if not user_id:
        raise HTTPException(status_code=401, detail="Sesi login tidak valid atau kedaluwarsa.")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Akun tidak ditemukan.")
    return user


# --- SCHEMAS ---
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$")
PHONE_RE = re.compile(r"^[0-9+\-\s()]{7,20}$")
ALLOWED_SIZES = {"S", "M", "L", "XL", "XXL"}


def _clean_email(value: str) -> str:
    value = value.strip().lower()
    if not EMAIL_RE.match(value):
        raise ValueError("Format email tidak valid")
    return value


def _clean_phone(value: str) -> str:
    value = value.strip()
    if not PHONE_RE.match(value):
        raise ValueError("Format nomor telepon tidak valid")
    return value


class ProductBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    price: int = Field(ge=0, le=1_000_000_000)
    stock: int = Field(ge=0, le=100_000)
    description: str = Field(default="", max_length=5000)
    category: str = Field(min_length=1, max_length=60)
    image_url: Optional[str] = Field(default=None, max_length=20_000_000)
    is_coming_soon: bool = False

class ProductResponse(ProductBase):
    id: int
    class Config:
        from_attributes = True

class OrderItemRequest(BaseModel):
    product_id: int = Field(ge=1)
    quantity: int = Field(ge=1, le=99)
    size: str = "L"

    @field_validator("size")
    @classmethod
    def validate_size(cls, value: str) -> str:
        normalized = value.strip().upper()
        if normalized not in ALLOWED_SIZES:
            raise ValueError("Ukuran tidak didukung")
        return normalized

class OrderRequest(BaseModel):
    items: List[OrderItemRequest] = Field(min_length=1, max_length=50)
    customer_name: str = Field(min_length=1, max_length=120)
    customer_email: str
    customer_phone: str

    @field_validator("customer_email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return _clean_email(value)

    @field_validator("customer_phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        return _clean_phone(value)

class AdminLogin(BaseModel):
    username: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=1, max_length=200)

class UserRegister(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str
    phone: str
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return _clean_email(value)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        return _clean_phone(value)

class UserLogin(BaseModel):
    email: str
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return _clean_email(value)

# --- PUBLIC ENDPOINTS ---
@app.get("/")
def root():
    return {"status": "success", "message": "API Zoom Custom Active!"}

@app.get("/api/health")
def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "ok"}
    except Exception:
        raise HTTPException(status_code=503, detail="Database tidak terjangkau")

# --- AUTH PEMBELI / USER ENDPOINTS (DENGAN BCRYPT & SALT) ---
@app.post("/api/auth/register")
def register_user(user_data: UserRegister, request: Request, db: Session = Depends(get_db)):
    if not allow(client_key(request, "register"), 5, 300):
        raise HTTPException(status_code=429, detail="Terlalu banyak pendaftaran. Coba lagi nanti.")

    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar!")

    hashed_pwd = hash_password(user_data.password)
    new_user = models.User(
        name=user_data.name,
        email=user_data.email,
        phone=user_data.phone,
        password_hash=hashed_pwd
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    user_payload = {
        "id": new_user.id,
        "name": new_user.name,
        "email": new_user.email,
        "phone": new_user.phone
    }

    return {
        "status": "success",
        "message": "Pendaftaran berhasil!",
        "token": issue_user_token(new_user.id),
        "user": user_payload
    }

@app.post("/api/auth/login")
def login_user(credentials: UserLogin, request: Request, db: Session = Depends(get_db)):
    if not allow(client_key(request, "login"), 10, 60):
        raise HTTPException(status_code=429, detail="Terlalu banyak percobaan login. Coba lagi nanti.")

    user = db.query(models.User).filter(models.User.email == credentials.email).first()

    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Email atau password salah!")

    user_payload = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone
    }

    return {
        "status": "success",
        "message": "Login berhasil!",
        "token": issue_user_token(user.id),
        "user": user_payload
    }

# --- PRODUK ENDPOINTS ---
@app.get("/api/products", response_model=List[ProductResponse])
def read_products(db: Session = Depends(get_db)):
    return db.query(models.Product).all()

# --- CHECKOUT MIDTRANS (MULTI-ITEM) ---
@app.post("/api/checkout")
def create_transaction(
    order: OrderRequest,
    request: Request,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not allow(client_key(request, "checkout"), 20, 60):
        raise HTTPException(status_code=429, detail="Terlalu banyak percobaan checkout.")
    if not order.items:
        raise HTTPException(status_code=400, detail="Keranjang kosong")

    product_ids = [item.product_id for item in order.items]
    products = {p.id: p for p in db.query(models.Product).filter(models.Product.id.in_(product_ids)).all()}

    item_details = []
    total_qty = 0
    gross_amount = 0
    for item in order.items:
        product = products.get(item.product_id)
        if not product:
            raise HTTPException(status_code=404, detail=f"Produk ID {item.product_id} tidak ditemukan")
        if product.is_coming_soon:
            raise HTTPException(status_code=400, detail=f"'{product.name}' belum bisa dibeli (Coming Soon)")
        if item.quantity > product.stock:
            raise HTTPException(status_code=400, detail=f"Stok '{product.name}' tinggal {product.stock}")

        gross_amount += product.price * item.quantity
        total_qty += item.quantity
        item_details.append({
            "id": str(product.id),
            "price": product.price,
            "quantity": item.quantity,
            "name": product.name[:50],
        })

    admin_fee = 4000
    gross_amount += admin_fee
    item_details.append({"id": "ADMIN-FEE", "price": admin_fee, "quantity": 1, "name": "Biaya Penanganan / Sistem"})

    order_id = f"ZOOM-{uuid.uuid4().hex[:8].upper()}"

    # Identitas order diambil dari token user, bukan dari body yang bisa dipalsukan.
    new_order = models.Order(
        order_id=order_id,
        product_id=order.items[0].product_id,
        quantity=total_qty,
        size=order.items[0].size if len(order.items) == 1 else "MIX",
        total_amount=gross_amount,
        customer_name=current_user.name,
        customer_email=current_user.email,
        customer_phone=current_user.phone,
        status="PENDING"
    )
    db.add(new_order)

    for item in order.items:
        product = products[item.product_id]
        db.add(models.OrderItem(
            order_id=order_id,
            product_id=product.id,
            product_name=product.name,
            size=item.size,
            quantity=item.quantity,
            price_at_purchase=product.price,
        ))
    db.commit()

    param = {
        "transaction_details": {
            "order_id": order_id,
            "gross_amount": gross_amount
        },
        "item_details": item_details,
        "customer_details": {
            "first_name": current_user.name,
            "email": current_user.email,
            "phone": current_user.phone
        }
    }

    try:
        transaction = snap.create_transaction(param)
        return {
            "status": "success",
            "order_id": order_id,
            "token": transaction['token'],
            "redirect_url": transaction['redirect_url']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Gagal membuat transaksi pembayaran.")

def apply_midtrans_status(db: Session, order_id: str, status_data: dict) -> str:
    """Transisi status atomik dan idempoten. Dipanggil setelah status diverifikasi ke Midtrans."""
    transaction_status = str(status_data.get("transaction_status", "")).lower()
    fraud_status = str(status_data.get("fraud_status", "")).lower()
    currency = str(status_data.get("currency", "IDR")).upper()

    if currency != "IDR":
        raise HTTPException(status_code=400, detail="Mata uang transaksi tidak didukung")

    try:
        paid_amount = Decimal(str(status_data.get("gross_amount")))
    except (InvalidOperation, TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Nominal transaksi tidak valid")

    # Lock baris order agar dua notifikasi bersamaan tidak memproses dua kali.
    db_order = db.query(models.Order).filter(models.Order.order_id == order_id).with_for_update().first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order tidak ditemukan")
    if Decimal(db_order.total_amount) != paid_amount:
        raise HTTPException(status_code=400, detail="Nominal transaksi tidak cocok dengan order")

    if db_order.status == "PAID":
        db.commit()
        return "already_paid"
    if db_order.status == "EXPIRED":
        db.commit()
        return "expired_no_change"

    if transaction_status in ("capture", "settlement") and (
        transaction_status == "settlement" or fraud_status == "accept"
    ):
        db_order.status = "PAID"
        order_items = db.query(models.OrderItem).filter(models.OrderItem.order_id == order_id).all()
        for item in order_items:
            product = db.query(models.Product).filter(models.Product.id == item.product_id).with_for_update().first()
            if product:
                product.stock = max(0, product.stock - item.quantity)
        db.commit()
        return "paid"

    if transaction_status in ("cancel", "deny", "expire"):
        if db_order.status == "PENDING":
            db_order.status = "EXPIRED"
        db.commit()
        return "expired"

    if transaction_status == "pending":
        db.commit()
        return "pending"

    db.commit()
    return "ignored"


@app.post("/api/midtrans-webhook")
async def midtrans_webhook(request: Request, db: Session = Depends(get_db)):
    try:
        notification = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Body bukan JSON valid")

    order_id = notification.get("order_id")
    if not order_id:
        raise HTTPException(status_code=400, detail="order_id wajib ada")

    # Verifikasi signature bila tersedia. Status dan nominal tetap diambil dari API Midtrans.
    server_key = os.getenv("MIDTRANS_SERVER_KEY", "")
    verify_signature = os.getenv("MIDTRANS_VERIFY_SIGNATURE", "true").lower() != "false"
    signature = notification.get("signature_key")
    if verify_signature and signature:
        status_code = notification.get("status_code")
        gross_amount = notification.get("gross_amount")
        if not (server_key and status_code and gross_amount):
            raise HTTPException(status_code=400, detail="Signature webhook tidak lengkap")
        expected = hashlib.sha512(
            f"{order_id}{status_code}{gross_amount}{server_key}".encode("utf-8")
        ).hexdigest()
        if not hmac.compare_digest(str(signature), expected):
            raise HTTPException(status_code=401, detail="Signature webhook tidak valid")

    try:
        status_data = snap.transactions.status(order_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Transaksi tidak ditemukan di Midtrans")

    if str(status_data.get("order_id", "")) != str(order_id):
        raise HTTPException(status_code=400, detail="Order ID tidak cocok")

    result = apply_midtrans_status(db, order_id, status_data)
    return {"status": "ok", "result": result}

# --- ADMIN ENDPOINTS ---
@app.post("/api/admin/login")
def admin_login(data: AdminLogin, request: Request):
    if not allow(client_key(request, "admin_login"), 5, 300):
        raise HTTPException(status_code=429, detail="Terlalu banyak percobaan login admin.")
    admin_user = os.getenv("ADMIN_USERNAME", "admin")
    admin_pass = os.getenv("ADMIN_PASSWORD", "")
    if data.username == admin_user and admin_pass and secrets.compare_digest(data.password, admin_pass):
        return {"status": "success", "token": ADMIN_TOKEN}
    return {"status": "error", "message": "Username atau password salah!"}

@app.post("/api/products", response_model=ProductResponse)
def create_product(product: ProductBase, db: Session = Depends(get_db), _=Depends(verify_admin)):
    db_product = models.Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@app.put("/api/products/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, product: ProductBase, db: Session = Depends(get_db), _=Depends(verify_admin)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")
    
    for key, value in product.model_dump().items():
        setattr(db_product, key, value)
        
    db.commit()
    db.refresh(db_product)
    return db_product

@app.delete("/api/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), _=Depends(verify_admin)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")
    db.delete(db_product)
    db.commit()
    return {"status": "success", "message": f"Produk ID {product_id} berhasil dihapus"}

@app.get("/api/admin/orders")
def get_admin_orders(range: str = Query("1_month"), db: Session = Depends(get_db), _=Depends(verify_admin)):
    now = datetime.now(timezone.utc)
    query = db.query(models.Order)

    if range == "today":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        query = query.filter(models.Order.created_at >= start_date)
    elif range == "yesterday":
        start_date = (now - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        query = query.filter(models.Order.created_at >= start_date, models.Order.created_at < end_date)
    elif range == "7_days":
        query = query.filter(models.Order.created_at >= now - timedelta(days=7))
    elif range == "1_month":
        query = query.filter(models.Order.created_at >= now - timedelta(days=30))
    elif range == "3_months":
        query = query.filter(models.Order.created_at >= now - timedelta(days=90))
    elif range == "1_year":
        query = query.filter(models.Order.created_at >= now - timedelta(days=365))

    orders = query.order_by(models.Order.created_at.desc()).all()
    return orders

@app.get("/api/admin/analytics")
def get_admin_analytics(db: Session = Depends(get_db), _=Depends(verify_admin)):
    now = datetime.now(timezone.utc)
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    total_orders = db.query(models.Order).filter(models.Order.created_at >= start_of_month).count()
    paid_orders = db.query(models.Order).filter(models.Order.created_at >= start_of_month, models.Order.status == "PAID").count()
    pending_orders = db.query(models.Order).filter(models.Order.created_at >= start_of_month, models.Order.status == "PENDING").count()
    
    total_revenue = db.query(func.sum(models.Order.total_amount)).filter(
        models.Order.created_at >= start_of_month, models.Order.status == "PAID"
    ).scalar() or 0

    return {
        "total_orders": total_orders,
        "paid_orders": paid_orders,
        "pending_orders": pending_orders,
        "total_revenue": total_revenue
    }