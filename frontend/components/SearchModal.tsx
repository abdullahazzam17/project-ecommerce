"use client";

import { useEffect } from "react";
import type { Product } from "../lib/types";

interface SearchModalProps {
  open: boolean;
  products: Product[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onClose: () => void;
  onSelectProduct: (p: Product) => void;
}

export default function SearchModal({ open, products, searchQuery, onSearchChange, onClose, onSelectProduct }: SearchModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-ink/60 px-4 pt-16 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search products"
        className="max-h-[85vh] w-full max-w-3xl space-y-6 overflow-y-auto border border-line bg-surface p-6 shadow-2xl md:p-8"
      >
        <div className="flex items-center gap-3 border-b border-ink pb-3">
          <svg aria-hidden="true" className="h-6 w-6 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search products"
            aria-label="Search products"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            autoFocus
            className="w-full border-none bg-transparent text-lg font-bold text-ink outline-none placeholder:text-muted md:text-xl"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="flex min-h-11 min-w-11 items-center justify-center text-xl font-black text-muted transition-colors duration-200 hover:text-ink"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-muted">
            {searchQuery !== "" ? `Results (${products.length})` : "All products"}
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {products.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => onSelectProduct(product)}
                className="group border border-line bg-canvas p-2 text-left transition-colors duration-200 hover:border-ink"
              >
                <span className="relative mb-2 block aspect-square overflow-hidden bg-[#e6e2d9]">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      width={400}
                      height={400}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-[10px] text-muted">
                      No image
                    </span>
                  )}
                  {product.is_coming_soon ? (
                    <span className="absolute left-1 top-1 bg-ink px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-inverse">
                      Soon
                    </span>
                  ) : null}
                </span>
                <span className="line-clamp-1 break-words text-[11px] font-bold uppercase">{product.name}</span>
                <span className="mt-1 block break-words text-[11px] font-bold">
                  Rp {product.price.toLocaleString("id-ID")}
                </span>
              </button>
            ))}
          </div>

          {products.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No products match this search.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
