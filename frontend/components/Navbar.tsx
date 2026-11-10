"use client";

import { useEffect, useState } from "react";
import type { StoreView, User } from "../lib/types";

interface NavbarProps {
  currentView: StoreView;
  changeView: (v: StoreView) => void;
  user: User | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  onOpenSearch: () => void;
  onOpenCart: () => void;
  cartCount: number;
  onSelectCategory: (category: string) => void;
}

export default function Navbar({
  currentView,
  changeView,
  user,
  onLogout,
  onOpenAuth,
  onOpenSearch,
  onOpenCart,
  cartCount,
  onSelectCategory,
}: NavbarProps) {
  const [isShopMenuOpen, setIsShopMenuOpen] = useState(false);
  const closeMenu = () => setIsShopMenuOpen(false);

  useEffect(() => {
    if (!isShopMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isShopMenuOpen]);

  const isShopActive =
    currentView === "catalog" || currentView === "coming_soon" || currentView === "detail";
  const isLookbookActive = currentView === "lookbooks";

  const goToCategory = (category: string) => {
    onSelectCategory(category);
    closeMenu();
  };

  return (
    <>
      <header
        className="sticky top-0 z-50 h-16 border-b border-line bg-surface/95 backdrop-blur-sm"
        onMouseLeave={closeMenu}
      >
        <div className="mx-auto grid h-full max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center px-5 md:px-12">
          {/* Kiri: menu mobile + navigasi desktop */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={isShopMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isShopMenuOpen}
              aria-controls="shop-menu"
              onClick={() => setIsShopMenuOpen(!isShopMenuOpen)}
              className="flex min-h-11 min-w-11 items-center justify-center md:hidden"
            >
              <svg
                aria-hidden="true"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <nav
              aria-label="Main"
              className="hidden items-center gap-8 font-mono text-xs font-bold uppercase tracking-widest md:flex"
            >
              <button
                type="button"
                onClick={() => setIsShopMenuOpen(!isShopMenuOpen)}
                aria-expanded={isShopMenuOpen}
                aria-controls="shop-menu"
                aria-current={isShopActive ? "page" : undefined}
                className={`min-h-11 transition-opacity duration-200 hover:opacity-60 ${
                  isShopActive ? "underline underline-offset-8" : ""
                }`}
              >
                Shop
              </button>
              <button
                type="button"
                onClick={() => {
                  changeView("lookbooks");
                  closeMenu();
                }}
                aria-current={isLookbookActive ? "page" : undefined}
                className={`min-h-11 transition-opacity duration-200 hover:opacity-60 ${
                  isLookbookActive ? "underline underline-offset-8" : ""
                }`}
              >
                Lookbooks
              </button>
            </nav>
          </div>

          {/* Tengah: logo (beranda) */}
          <button
            type="button"
            onClick={() => {
              changeView("hero");
              closeMenu();
            }}
            aria-label="Zoom Cloth home"
            className="flex min-h-11 items-center justify-center px-2"
          >
            <span className="text-sm font-black uppercase tracking-[0.18em] md:text-base">
              Zoom Cloth
            </span>
          </button>

          {/* Kanan: cari, akun, keranjang */}
          <div className="flex items-center justify-end gap-1 sm:gap-3">
            <button
              type="button"
              onClick={onOpenSearch}
              aria-label="Search products"
              className="flex min-h-11 min-w-11 items-center justify-center transition-opacity duration-200 hover:opacity-60"
            >
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => (user ? onLogout() : onOpenAuth())}
              aria-label={user ? `Account: ${user.name}. Sign out` : "Sign in"}
              className="flex min-h-11 min-w-11 items-center justify-center gap-1 transition-opacity duration-200 hover:opacity-60"
            >
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {user ? (
                <span className="hidden text-[10px] font-bold lg:inline">({user.name})</span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={onOpenCart}
              aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"}
              className="relative flex min-h-11 min-w-11 items-center justify-center transition-opacity duration-200 hover:opacity-60"
            >
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center bg-ink px-1 text-[9px] font-extrabold text-inverse"
                >
                  {cartCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        {/* Menu Shop: hanya kategori yang benar-benar ada */}
        {isShopMenuOpen ? (
          <div
            id="shop-menu"
            className="absolute inset-x-0 top-full border-b border-line bg-surface shadow-[0_12px_30px_rgba(0,0,0,0.08)]"
          >
            <div className="mx-auto max-w-[1440px] px-5 py-4 md:px-12">
              <ul className="flex flex-col gap-1 md:max-w-sm">
                <li>
                  <button
                    type="button"
                    onClick={() => goToCategory("ALL")}
                    className="flex min-h-12 w-full items-center px-3 text-left text-sm font-bold uppercase tracking-widest transition-colors duration-200 hover:bg-canvas"
                  >
                    All products
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => goToCategory("Baju")}
                    className="flex min-h-12 w-full items-center px-3 text-left text-sm font-bold uppercase tracking-widest transition-colors duration-200 hover:bg-canvas"
                  >
                    Baju
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => goToCategory("Hoodie")}
                    className="flex min-h-12 w-full items-center px-3 text-left text-sm font-bold uppercase tracking-widest transition-colors duration-200 hover:bg-canvas"
                  >
                    Hoodie
                  </button>
                </li>
              </ul>
            </div>
          </div>
        ) : null}
      </header>

      {/* Overlay gelap saat menu terbuka */}
      {isShopMenuOpen ? (
        <div
          className="fixed inset-0 z-40 bg-ink/30"
          onClick={closeMenu}
          aria-hidden="true"
        />
      ) : null}
    </>
  );
}
