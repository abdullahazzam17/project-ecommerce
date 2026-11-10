// Tipe data bersama untuk seluruh storefront & admin

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  description: string;
  category: string;
  image_url?: string;
  images?: string[];
  is_coming_soon?: boolean;
  /** Hanya true untuk fixture demo lokal. Tidak pernah berasal dari API. */
  isDemo?: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
}

// Satu baris di keranjang belanja
export interface CartItem {
  product: Product;
  size: string;
  quantity: number;
}

// Halaman-halaman storefront yang bisa diakses
export type StoreView = "hero" | "catalog" | "coming_soon" | "lookbooks" | "detail";
