"use client";

import { useCallback, useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import SearchModal from "../components/SearchModal";
import CartDrawer from "../components/CartDrawer";
import AuthModal from "../components/AuthModal";
import HeroView from "../components/HeroView";
import EditorialStory from "../components/EditorialStory";
import CollectionPreview from "../components/CollectionPreview";
import MaterialDetail from "../components/MaterialDetail";
import ProductionStory from "../components/ProductionStory";
import UndergroundStatement from "../components/UndergroundStatement";
import CatalogView from "../components/CatalogView";
import LookbookView from "../components/LookbookView";
import DetailView from "../components/DetailView";
import Footer from "../components/Footer";
import { API_URL } from "../lib/api";
import { DEMO_ENABLED } from "../lib/demoConfig";
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
  const [viewAnimation, setViewAnimation] = useState("opacity-100");

  // UI Overlays
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
  const [isProcessing, setIsProcessing] = useState(false);

  const demoMode = DEMO_ENABLED;

  const fetchProducts = useCallback(async () => {
    // Demo mode is explicit and isolated: no API call, no fallback behavior.
    if (demoMode) {
      const { demoProducts } = await import("../lib/mockProducts");
      setProductsError(false);
      setProducts(demoProducts);
      setLoading(false);
      return;
    }

    try {
      setProductsError(false);
      setLoading(true);
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 6000);

      let res: Response;
      try {
        res = await fetch(`${API_URL}/api/products`, { signal: controller.signal });
      } finally {
        window.clearTimeout(timeoutId);
      }

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
  }, [demoMode]);

  useEffect(() => {
    const savedUser = localStorage.getItem("user_data");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hidrasi sesi klien sekali dari localStorage
    if (savedUser) setUser(JSON.parse(savedUser));

    fetchProducts();
  }, [fetchProducts]);

  const changeView = (newView: StoreView) => {
    setViewAnimation("opacity-0");
    setTimeout(() => {
      setCurrentView(newView);
      window.scrollTo({ top: 0, behavior: "instant" });
      setViewAnimation("opacity-100");
    }, 200);
  };

  const handleProductClick = (prod: Product) => {
    setSelectedProduct(prod);
    setIsSearchOpen(false);
    changeView("detail");
  };

  const handleAddToCart = (prod: Product, size: string, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === prod.id && item.size === size);
      if (existing) {
        return prev.map((item) =>
          item.product.id === prod.id && item.size === size
            ? { ...item, quantity: Math.min(item.quantity + quantity, item.product.stock) }
            : item
        );
      }
      return [...prev, { product: prod, size, quantity: Math.min(quantity, prod.stock) }];
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

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    changeView("catalog");
  };

  const handleCheckout = async (itemsToBuy: CartItem[]) => {
    if (itemsToBuy.length === 0) return;

    // Demo items never reach the checkout API or Midtrans.
    if (itemsToBuy.some((item) => item.product.isDemo)) {
      window.alert("Checkout is unavailable in demo preview.");
      return;
    }

    if (!user) {
      setShowAuthModal(true);
      return;
    }

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
            setCart([]);
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

  const availableProducts = products.filter((p) => !p.is_coming_soon);
  const comingSoonProducts = products.filter((p) => p.is_coming_soon);

  const filteredProducts = (currentView === "coming_soon" ? comingSoonProducts : availableProducts).filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const category = p.category.toLowerCase();
    const matchesCategory =
      selectedCategory === "ALL" ||
      (selectedCategory === "Hoodie" ? category.includes("hoodie") : !category.includes("hoodie"));
    return matchesSearch && matchesCategory;
  });

  const activeImages = selectedProduct?.images?.length ? selectedProduct.images : [FALLBACK_IMAGE];
  const cartCount = cart.reduce((a, b) => a + b.quantity, 0);

  return (
    <div className="flex min-h-screen w-full flex-col bg-canvas font-sans text-ink antialiased selection:bg-ink selection:text-inverse">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:bg-ink focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-inverse"
      >
        Skip to content
      </a>

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
        demoMode={demoMode}
      />

      <SearchModal
        open={isSearchOpen}
        products={filteredProducts}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClose={() => setIsSearchOpen(false)}
        onSelectProduct={handleProductClick}
      />

      <main
        id="main-content"
        className={`flex w-full flex-1 flex-col transition-opacity duration-200 ease-in-out ${viewAnimation}`}
      >
        {currentView === "hero" && (
          <>
            <HeroView
              onShopNow={() => changeView("catalog")}
              onViewLookbook={() => changeView("lookbooks")}
            />
            <EditorialStory />
            <CollectionPreview
              products={availableProducts}
              loading={loading}
              error={productsError}
              demoMode={demoMode}
              onRetry={fetchProducts}
              onSelectProduct={handleProductClick}
              onViewAll={() => {
                setSelectedCategory("ALL");
                changeView("catalog");
              }}
              onExploreLookbook={() => changeView("lookbooks")}
            />
            <MaterialDetail />
            <ProductionStory
              onViewCollection={() => {
                setSelectedCategory("ALL");
                changeView("catalog");
              }}
            />
            <UndergroundStatement />
          </>
        )}

        {(currentView === "catalog" || currentView === "coming_soon") && (
          <CatalogView
            isComingSoon={currentView === "coming_soon"}
            category={selectedCategory}
            filteredProducts={filteredProducts}
            loading={loading}
            error={productsError}
            demoMode={demoMode}
            onRetry={fetchProducts}
            onProductClick={handleProductClick}
            onSelectCategory={handleSelectCategory}
          />
        )}

        {currentView === "lookbooks" && <LookbookView />}

        {currentView === "detail" && selectedProduct && (
          <DetailView
            key={selectedProduct.id}
            product={selectedProduct}
            images={activeImages}
            isProcessing={isProcessing}
            onBack={() => changeView("catalog")}
            onBuyNow={(size, quantity) =>
              handleCheckout([{ product: selectedProduct, size, quantity }])
            }
            onAddToCart={(size, quantity) => handleAddToCart(selectedProduct, size, quantity)}
          />
        )}
      </main>

      <CartDrawer
        open={isCartOpen}
        cart={cart}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => handleCheckout(cart)}
        onRemove={handleRemoveFromCart}
        onQuantityChange={handleCartQuantity}
        isProcessing={isProcessing}
      />

      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

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
