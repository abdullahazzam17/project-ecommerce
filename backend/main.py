import os
import uuid
import midtransclient
from datetime import datetime, timedelta
from fastapi import FastAPI, Depends, HTTPException, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
from passlib.context import CryptContext

import models
from database import engine, get_db

load_dotenv()

# Auto-create tabel di Supabase
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Zoom Custom E-Commerce API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

class OrderRequest(BaseModel):
    product_id: int
    quantity: int
    size: str = "L"
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
        "token": f"user-token-{new_user.id}",
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
        "token": f"user-token-{user.id}",
        "user": user_payload
    }

# --- PRODUK ENDPOINTS ---
@app.get("/api/products", response_model=List[ProductResponse])
def read_products(db: Session = Depends(get_db)):
    return db.query(models.Product).all()

# --- CHECKOUT MIDTRANS ---
@app.post("/api/checkout")
def create_transaction(order: OrderRequest, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == order.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")
    
    product_subtotal = product.price * order.quantity
    admin_fee = 4000
    gross_amount = product_subtotal + admin_fee

    order_id = f"ZOOM-{uuid.uuid4().hex[:8].upper()}"

    new_order = models.Order(
        order_id=order_id,
        product_id=product.id,
        quantity=order.quantity,
        size=order.size,
        total_amount=gross_amount,
        customer_name=order.customer_name,
        customer_email=order.customer_email,
        customer_phone=order.customer_phone,
        status="PENDING"
    )
    db.add(new_order)
    db.commit()

    param = {
        "transaction_details": {
            "order_id": order_id,
            "gross_amount": gross_amount
        },
        "item_details": [
            {
                "id": str(product.id),
                "price": product.price,
                "quantity": order.quantity,
                "name": product.name
            },
            {
                "id": "ADMIN-FEE",
                "price": admin_fee,
                "quantity": 1,
                "name": "Biaya Penanganan / Sistem"
            }
        ],
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
    notification = await request.json()
    order_id = notification.get("order_id")
    transaction_status = notification.get("transaction_status")
    fraud_status = notification.get("fraud_status")

    db_order = db.query(models.Order).filter(models.Order.order_id == order_id).first()

    if transaction_status in ['capture', 'settlement']:
        if fraud_status == 'accept' or transaction_status == 'settlement':
            if db_order:
                db_order.status = "PAID"
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
    if data.username == "admin" and data.password == "zoom123":
        return {"status": "success", "token": "admin-super-secret-token"}
    return {"status": "error", "message": "Username atau password salah!"}

@app.post("/api/products", response_model=ProductResponse)
def create_product(product: ProductBase, db: Session = Depends(get_db)):
    db_product = models.Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@app.put("/api/products/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, product: ProductBase, db: Session = Depends(get_db)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")
    
    for key, value in product.dict().items():
        setattr(db_product, key, value)
        
    db.commit()
    db.refresh(db_product)
    return db_product

@app.delete("/api/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")
    db.delete(db_product)
    db.commit()
    return {"status": "success", "message": f"Produk ID {product_id} berhasil dihapus"}

@app.get("/api/admin/orders")
def get_admin_orders(range: str = Query("1_month"), db: Session = Depends(get_db)):
    now = datetime.utcnow()
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
def get_admin_analytics(db: Session = Depends(get_db)):
    now = datetime.utcnow()
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