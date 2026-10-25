import os
import uuid
import secrets
import midtransclient
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, Depends, HTTPException, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.utils import get_authorization_scheme_param
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, Field
from typing import List, Optional
from dotenv import load_dotenv
from passlib.context import CryptContext

import models
from database import engine, get_db

load_dotenv()

# Auto-create tabel di Supabase
models.Base.metadata.create_all(bind=engine)

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-warm pool DB: buka 5 koneksi SATU PER SATU lalu kembalikan ke pool.
    # Tanpa ini, request pertama yang datang bersamaan memaksa pool membuat
    # banyak koneksi sekaligus -> Supavisor (session mode) menghambat/menolak
    # pembuatan massal -> semua request menunggu 30 detik lalu timeout.
    conns = []
    for _ in range(10):  # = pool_size penuh: 10 koneksi dibuka BERURUTAN
        try:
            conns.append(engine.connect())
        except Exception as e:
            print("Pre-warm pool terputus (lanjut tanpa pre-warm penuh):", e)
            break
    for conn in conns:
        conn.close()
    yield

app = FastAPI(title="Zoom Custom E-Commerce API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    # Whitelist origin eksplisit (standar keamanan) — bukan "*"
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://192.168.0.1:3000",  # akses demo via LAN (HP)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# --- SCHEMAS ---
class ProductBase(BaseModel):
    name: str
    price: int
    stock: int
    description: str
    category: str
    image_url: Optional[str] = None
    is_coming_soon: Optional[bool] = False  # Fitur baru ditambahkan disini tanpa merubah yang lain

class ProductResponse(ProductBase):
    id: int
    class Config:
        from_attributes = True

class OrderItemRequest(BaseModel):
    product_id: int
    quantity: int = Field(ge=1, le=999)  # validasi: minimal 1, maksimal 999
    size: str = "L"

class OrderRequest(BaseModel):
    items: List[OrderItemRequest]  # MULTI-ITEM: isi keranjang dikirim utuh
    customer_name: str
    customer_email: str
    customer_phone: str

class AdminLogin(BaseModel):
    username: str
    password: str

class UserRegister(BaseModel):
    name: str
    email: str
    phone: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

# --- PUBLIC ENDPOINTS ---
@app.get("/")
def root():
    return {"status": "success", "message": "API Zoom Custom Active!"}

# --- AUTH PEMBELI / USER ENDPOINTS (DENGAN BCRYPT & SALT) ---
@app.post("/api/auth/register")
def register_user(user_data: UserRegister, db: Session = Depends(get_db)):
    # Cek apakah email sudah terdaftar
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar!")

    # Password otomatis di-salt dan di-hash menggunakan Bcrypt
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
        "token": secrets.token_hex(16),  # token acak, bukan pola yang bisa ditebak
        "user": user_payload
    }

@app.post("/api/auth/login")
def login_user(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()

    # Verifikasi password plain melawan salted hash yang ada di Supabase
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
        "token": secrets.token_hex(16),  # token acak, bukan pola yang bisa ditebak
        "user": user_payload
    }

# --- PRODUK ENDPOINTS ---
@app.get("/api/products", response_model=List[ProductResponse])
def read_products(db: Session = Depends(get_db)):
    return db.query(models.Product).all()

# --- CHECKOUT MIDTRANS (MULTI-ITEM) ---
@app.post("/api/checkout")
def create_transaction(order: OrderRequest, db: Session = Depends(get_db)):
    if not order.items:
        raise HTTPException(status_code=400, detail="Keranjang kosong")

    # Ambil semua produk sekaligus & validasi stok per item
    product_ids = [i.product_id for i in order.items]
    products = {p.id: p for p in db.query(models.Product).filter(models.Product.id.in_(product_ids)).all()}

    item_details = []
    total_qty = 0
    gross_amount = 0
    for item in order.items:
        product = products.get(item.product_id)
        if not product:
            raise HTTPException(status_code=404, detail=f"Produk ID {item.product_id} tidak ditemukan")
        if item.quantity > product.stock:
            raise HTTPException(status_code=400, detail=f"Stok '{product.name}' tinggal {product.stock}")
        if product.is_coming_soon:
            raise HTTPException(status_code=400, detail=f"'{product.name}' belum bisa dibeli (Coming Soon)")

        subtotal = product.price * item.quantity
        gross_amount += subtotal
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

    new_order = models.Order(
        order_id=order_id,
        product_id=order.items[0].product_id,      # kompatibilitas kolom lama: item pertama
        quantity=total_qty,                        # total seluruh item
        size=order.items[0].size if len(order.items) == 1 else "MIX",
        total_amount=gross_amount,
        customer_name=order.customer_name,
        customer_email=order.customer_email,
        customer_phone=order.customer_phone,
        status="PENDING"
    )
    db.add(new_order)

    # Rincian per item — dipakai juga untuk pengurangan stok saat PAID
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
            "first_name": order.customer_name,
            "email": order.customer_email,
            "phone": order.customer_phone
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
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/midtrans-webhook")
async def midtrans_webhook(request: Request, db: Session = Depends(get_db)):
    # Body bengkok / bukan JSON -> 400 (bukan crash 500)
    try:
        notification = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Body bukan JSON valid")

    order_id = notification.get("order_id")
    if not order_id:
        raise HTTPException(status_code=400, detail="order_id wajib ada")

    # JANGAN percaya isi body dari caller. Status kebenaran diambil
    # langsung dari Midtrans (standar keamanan payment gateway).
    try:
        status_data = snap.transactions.status(order_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Transaksi tidak ditemukan di Midtrans")

    transaction_status = status_data.get("transaction_status")
    fraud_status = status_data.get("fraud_status")

    db_order = db.query(models.Order).filter(models.Order.order_id == order_id).first()

    if transaction_status in ['capture', 'settlement']:
        if fraud_status == 'accept' or transaction_status == 'settlement':
            if db_order:
                db_order.status = "PAID"
                # Stok baru benar-benar berkurang HANYA saat pembayaran lunas
                order_items = db.query(models.OrderItem).filter(models.OrderItem.order_id == order_id).all()
                for oi in order_items:
                    product = db.query(models.Product).filter(models.Product.id == oi.product_id).first()
                    if product:
                        product.stock = max(0, product.stock - oi.quantity)
    elif transaction_status in ['cancel', 'deny', 'expire']:
        if db_order:
            db_order.status = "EXPIRED"
    elif transaction_status == 'pending':
        if db_order:
            db_order.status = "PENDING"

    if db_order:
        db.commit()

    return {"status": "ok"}

# --- ADMIN ENDPOINTS ---
@app.post("/api/admin/login")
def admin_login(data: AdminLogin):
    # Kredensial dari environment (bukan lagi hardcode di source)
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