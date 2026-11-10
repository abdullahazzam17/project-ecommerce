"use client";

import { useCallback, useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import SearchModal from "../components/SearchModal";
import CartDrawer from "../components/CartDrawer";
import AuthModal from "../components/AuthModal";
import HeroView from "../components/HeroView";
import CatalogView from "../components/CatalogView";
import LookbookView from "../components/LookbookView";
import DetailView from "../components/DetailView";
import LatestPieces from "../components/LatestPieces";
import CategorySection from "../components/CategorySection";
import Footer from "../components/Footer";
import { API_URL } from "../lib/api";
import { FALLBACK_IMAGE, parseImages } from "../lib/images";
import type { CartItem, Product, StoreView, User } from "../lib/types";

// Tipe minimal Snap.js (dimuat dari Midtrans) - pengganti `any` sesuai quality gate.
interface SnapCallbacks {
  onSuccess?: () => void;
  onPending?: () => void;
  onError?: () => void;
  onClose?: () => void;
}

declare global {
  interface Window {
    snap?: {
      pay: (token: string, callbacks: SnapCallbacks) => void;
    };
  }
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsError, setProductsError] = useState(false);

  // Main Views: "hero", "catalog", "coming_soon", "lookbooks", "detail"
  const [currentView, setCurrentView] = useState<StoreView>("hero");

  // State untuk trigger transisi antar view
  const [viewAnimation, setViewAnimation] = useState("opacity-100");

  // UI Overlays (state menu toko kini berada di dalam Navbar)
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filters & Auth
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Product Selection & Cart
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Muat katalog dari API. Dideklarasikan sebelum effect agar urutan deklarasi jelas
  // dan referensinya stabil sebagai dependency.
  const fetchProducts = useCallback(async () => {
    try {
      setProductsError(false);
      setLoading(true);
      const res = await fetch(`${API_URL}/api/products`);
      if (!res.ok) throw new Error("Gagal fetch data produk");

      const data = await res.json();
      if (Array.isArray(data)) {
        const formatted = data.map((item) => {
          const parsed = parseImages(item.image_url);
          const imgList = parsed.length > 0 ? parsed : [FALLBACK_IMAGE];
          return { ...item, images: imgList };
        });
        setProducts(formatted);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setProductsError(true);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Sesi pembeli dibaca sekali setelah mount; localStorage tidak tersedia saat SSR,
    // sehingga pembacaan di effect adalah pola yang benar (bukan derived state).
    const savedUser = localStorage.getItem("user_data");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hidrasi sesi klien sekali dari localStorage
    if (savedUser) setUser(JSON.parse(savedUser));

    fetchProducts();
  }, [fetchProducts]);

  // Fungsi ganti halaman dengan animasi transisi halus (Fade)
  const changeView = (newView: StoreView) => {
    setViewAnimation("opacity-0 scale-95");
    setTimeout(() => {
      setCurrentView(newView);
      window.scrollTo({ top: 0, behavior: "instant" });
      setViewAnimation("opacity-100 scale-100");
    }, 250);
  };

  const handleProductClick = (prod: Product) => {
    setSelectedProduct(prod);
    setIsSearchOpen(false);

    setRecentlyViewed((prev) => {
      const filtered = prev.filter((p) => p.id !== prod.id);
      return [prod, ...filtered].slice(0, 4);
    });

    changeView("detail");
  };

  const handleAddToCart = (prod: Product, size: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === prod.id && item.size === size);
      if (existing) {
        return prev.map((item) =>
          item.product.id === prod.id && item.size === size
            ? { ...item, quantity: Math.min(item.quantity + 1, item.product.stock) }
            : item
        );
      }
      return [...prev, { product: prod, size, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleRemoveFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCartQuantity = (index: number, quantity: number) => {
    setCart((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, quantity: Math.max(1, Math.min(quantity, item.product.stock)) }
          : item
      )
    );
  };

  // Pilih kategori dari mega menu → langsung buka katalog
  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    changeView("catalog");
  };

  // ============ CHECKOUT TUNGGAL (MULTI-ITEM) ============
  // Dipakai oleh: BUY NOW (1 item, size terpilih) & CHECKOUT BAG (seluruh keranjang).
  // PERBAIKAN: dulu checkout bag hanya mengirim item pertama qty 1 & BUY NOW
  // tidak mengirim ukuran - sekarang semua item + size + qty dikirim utuh.
  const handleCheckout = async (itemsToBuy: CartItem[]) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (itemsToBuy.length === 0) return;

    setIsProcessing(true);

    try {
      const response = await fetch(`${API_URL}/api/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: itemsToBuy.map((item) => ({
            product_id: item.product.id,
            quantity: Number(item.quantity),
            size: item.size,
          })),
          customer_name: user.name,
          customer_email: user.email,
          customer_phone: user.phone,
        }),
      });

      const data = await response.json();

      if (data.token) {
        if (!window.snap) {
          alert("Modul pembayaran Midtrans belum siap. Muat ulang halaman lalu coba lagi.");
          return;
        }
        window.snap.pay(data.token, {
          onSuccess: function () {
            alert("Pembayaran Berhasil! Pesanan sedang diproses.");
            setCart([]); // keranjang dikosongkan setelah pembayaran sukses
            changeView("catalog");
            setIsCartOpen(false);
          },
          onPending: function () {
            alert("Menunggu pembayaran diselesaikan.");
          },
          onError: function () {
            alert("Pembayaran gagal, silakan coba lagi.");
          },
        });
      } else {
        alert(data.detail || "Gagal membuat transaksi.");
      }
    } catch (error) {
      alert("Gagal terhubung ke server checkout. Pastikan backend menyala!");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user_token");
    localStorage.removeItem("user_data");
    setUser(null);
  };

  const handleAuthSuccess = (u: User) => {
    setUser(u);
    setShowAuthModal(false);
  };

  // Filter Catalog Normal (Non Coming Soon)
  const availableProducts = products.filter((p) => !p.is_coming_soon);

  // Filter khusus Coming Soon
  const comingSoonProducts = products.filter((p) => p.is_coming_soon);

  const filteredProducts = (currentView === "coming_soon" ? comingSoonProducts : availableProducts).filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    // Dua kategori disetujui: Baju (non-hoodie) dan Hoodie. Mapping sementara (SRS D-03).
    const category = p.category.toLowerCase();
    const matchesCategory =
      selectedCategory === "ALL" ||
      (selectedCategory === "Hoodie" ? category.includes("hoodie") : !category.includes("hoodie"));
    return matchesSearch && matchesCategory;
  });

  const activeImages = selectedProduct?.images || [FALLBACK_IMAGE];
  const cartCount = cart.reduce((a, b) => a + b.quantity, 0);

  return (
    <div className="flex min-h-screen w-full flex-col bg-canvas font-sans text-ink antialiased selection:bg-ink selection:text-inverse">

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:bg-ink focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-inverse"
      >
        Skip to content
      </a>

      {/* HEADER + MENU */}
      <Navbar
        currentView={currentView}
        changeView={changeView}
        user={user}
        onLogout={handleLogout}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        cartCount={cartCount}
        onSelectCategory={handleSelectCategory}
      />

      {/* MODAL SEARCH */}
      <SearchModal
        open={isSearchOpen}
        products={filteredProducts}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClose={() => setIsSearchOpen(false)}
        onSelectProduct={handleProductClick}
      />

      {/* ================= AREA KONTEN UTAMA ================= */}
      <main
        id="main-content"
        className={`flex w-full flex-1 flex-col transition-all duration-300 ease-in-out ${viewAnimation}`}
      >

        {/* VIEW 1: HOMEPAGE (scrollable) */}
        {currentView === "hero" && (
          <>
            <HeroView
              onShopNow={() => changeView("catalog")}
              onViewLookbook={() => changeView("lookbooks")}
            />
            <LatestPieces
              products={availableProducts}
              loading={loading}
              error={productsError}
              onRetry={fetchProducts}
              onSelectProduct={handleProductClick}
              onViewAll={() => {
                setSelectedCategory("ALL");
                changeView("catalog");
              }}
            />
            <CategorySection
              products={availableProducts}
              loading={loading}
              error={productsError}
              onSelectCategory={handleSelectCategory}
            />
          </>
        )}

        {/* VIEW 2: KATALOG / COMING SOON */}
        {(currentView === "catalog" || currentView === "coming_soon") && (
          <CatalogView
            isComingSoon={currentView === "coming_soon"}
            category={selectedCategory}
            filteredProducts={filteredProducts}
            loading={loading}
            error={productsError}
            onRetry={fetchProducts}
            onProductClick={handleProductClick}
          />
        )}

        {/* VIEW 3: LOOKBOOKS */}
        {currentView === "lookbooks" && <LookbookView />}

        {/* VIEW 4: DETAIL PRODUK - key=id supaya state foto/size reset saat ganti produk */}
        {currentView === "detail" && selectedProduct && (
          <DetailView
            key={selectedProduct.id}
            product={selectedProduct}
            images={activeImages}
            isProcessing={isProcessing}
            onBuyNow={(size) => handleCheckout([{ product: selectedProduct, size, quantity: 1 }])}
            onAddToCart={(size) => handleAddToCart(selectedProduct, size)}
          />
        )}
      </main>

      {/* SIDE DRAWER CART: checkout mengirim SELURUH isi keranjang */}
      <CartDrawer
        open={isCartOpen}
        cart={cart}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => handleCheckout(cart)}
        onRemove={handleRemoveFromCart}
        onQuantityChange={handleCartQuantity}
        isProcessing={isProcessing}
      />

      {/* MODAL AUTH - form & logika login/registrasi berada di dalam komponennya */}
      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* FOOTER */}
      <Footer
        onHome={() => changeView("hero")}
        onShop={() => {
          setSelectedCategory("ALL");
          changeView("catalog");
        }}
        onLookbook={() => changeView("lookbooks")}
      />
    </div>
  );
}
