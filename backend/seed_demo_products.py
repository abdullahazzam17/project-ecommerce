"""Seed produk demo yang dapat dihapus kapan saja.

Pemakaian (setelah DATABASE_URL benar):
  python seed_demo_products.py            # tambah jika belum ada
  python seed_demo_products.py --force    # hapus lalu tambah ulang
  python seed_demo_products.py --remove   # hapus semua produk demo

Produk demo selalu diawali "[DEMO]" agar mudah dicari/dihapus.
Tidak menyentuh produk asli.
"""

import argparse
import base64
from pathlib import Path

from database import SessionLocal, engine
import models

ASSET_DIR = Path(__file__).resolve().parent.parent / "frontend" / "assets"

DEMO_PRODUCTS = [
    {
        "name": "[DEMO] Graphic Tee - Orange Print",
        "price": 149000,
        "stock": 6,
        "category": "Baju",
        "description": "Demo product for storefront preview. Delete anytime with seed_demo_products.py --remove.",
        "image": "dummy_product.jpg",
    },
    {
        "name": "[DEMO] Back Print Tee",
        "price": 179000,
        "stock": 4,
        "category": "Baju",
        "description": "Demo product for storefront preview. Delete anytime with seed_demo_products.py --remove.",
        "image": "look_behind.jpg",
    },
    {
        "name": "[DEMO] Street Layered Tee",
        "price": 159000,
        "stock": 5,
        "category": "Baju",
        "description": "Demo product for storefront preview. Delete anytime with seed_demo_products.py --remove.",
        "image": "image_add.jpg",
    },
]


def data_url(filename: str) -> str:
    path = ASSET_DIR / filename
    if not path.exists():
        raise FileNotFoundError(f"Asset tidak ditemukan: {path}")
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:image/jpeg;base64,{encoded}"


def remove_demo(session) -> None:
    rows = session.query(models.Product).filter(models.Product.name.like("[DEMO]%")).all()
    for row in rows:
        session.delete(row)
    session.commit()
    print(f"Dihapus: {len(rows)} produk demo.")


def seed(session, force: bool) -> None:
    existing = session.query(models.Product).filter(models.Product.name.like("[DEMO]%")).count()
    if existing and not force:
        print(f"Sudah ada {existing} produk demo. Gunakan --force untuk menambah ulang atau --remove untuk menghapus.")
        return
    if existing and force:
        remove_demo(session)

    created = 0
    for item in DEMO_PRODUCTS:
        session.add(
            models.Product(
                name=item["name"],
                price=item["price"],
                stock=item["stock"],
                category=item["category"],
                description=item["description"],
                image_url=data_url(item["image"]),
                is_coming_soon=False,
            )
        )
        created += 1
    session.commit()
    print(f"Ditambahkan: {created} produk demo.")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--remove", action="store_true", help="hapus semua produk demo")
    parser.add_argument("--force", action="store_true", help="hapus lalu tambah ulang")
    args = parser.parse_args()

    models.Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        if args.remove:
            remove_demo(session)
        else:
            seed(session, args.force)
    finally:
        session.close()


if __name__ == "__main__":
    main()
