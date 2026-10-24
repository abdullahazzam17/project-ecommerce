from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from datetime import datetime
from database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    price = Column(Integer)
    stock = Column(Integer)
    description = Column(Text)
    category = Column(String)
    image_url = Column(String, nullable=True)  
    is_coming_soon = Column(Boolean, default=False)  # Tambahan untuk fitur Coming Soon

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String, unique=True, index=True)
    product_id = Column(Integer)
    quantity = Column(Integer)
    size = Column(String, default="L") # <--- TAMBAHKAN INI
    total_amount = Column(Integer)
    customer_name = Column(String)
    customer_email = Column(String)
    customer_phone = Column(String)
    status = Column(String, default="PENDING")
    created_at = Column(DateTime, default=datetime.utcnow)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)

