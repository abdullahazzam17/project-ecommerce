"use client";

import type { Product } from "../lib/types";

interface CatalogViewProps {
  isComingSoon: boolean;
  category: string;
  filteredProducts: Product[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onProductClick: (product: Product) => void;
}

export default function CatalogView({
  isComingSoon,
  category,
  filteredProducts,
  loading,
  error,
  onRetry,
  onProductClick,
}: CatalogViewProps) {
  const title = isComingSoon
    ? "Coming soon"
    : category === "ALL"
      ? "All products"
      : category;

  return (
    <section className="mx-auto w-full max-w-[1440px] flex-1 bg-canvas px-5 py-10 md:px-12 md:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <h2 className="text-[clamp(1.9rem,3.5vw,3rem)] font-black tracking-[-0.02em]">
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted" aria-live="polite">
            {loading
              ? "Loading products"
              : error
                ? "Products unavailable"
                : `${filteredProducts.length} items available`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
        {loading ? (
          <div className="col-span-full grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6" aria-busy="true">
            {[0, 1, 2, 3].map((slot) => (
              <div key={slot} className="animate-pulse">
                <div className="aspect-[4/5] bg-[#e6e2d9]" />
                <div className="mt-3 h-3 w-3/4 bg-[#e6e2d9]" />
                <div className="mt-2 h-3 w-1/3 bg-[#e6e2d9]" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="col-span-full border border-line bg-surface p-6">
            <p className="text-sm font-bold">Products could not be loaded.</p>
            <p className="mt-1 text-sm text-muted">
              Check that the store service is running, then try again.
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 min-h-11 border border-ink px-5 text-xs font-bold uppercase tracking-widest transition-colors duration-200 hover:bg-canvas"
            >
              Retry
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full py-16 text-center text-sm text-muted">
            {isComingSoon
              ? "No coming soon products yet."
              : "No products found for this category."}
          </div>
        ) : (
          filteredProducts.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => onProductClick(product)}
              className="group flex flex-col border border-line bg-surface text-left transition-colors duration-200 hover:border-ink"
            >
              <span className="relative block aspect-[4/5] overflow-hidden bg-[#e6e2d9]">
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    width={600}
                    height={750}
                    className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-xs text-muted">
                    No image
                  </span>
                )}
                {product.is_coming_soon ? (
                  <span className="absolute left-2 top-2 bg-ink px-2 py-1 text-[9px] font-black uppercase tracking-widest text-inverse">
                    Coming soon
                  </span>
                ) : null}
              </span>

              <span className="flex flex-1 flex-col justify-between p-3 md:p-4">
                <span className="line-clamp-2 text-xs font-bold uppercase leading-tight tracking-tight md:text-sm">
                  {product.name}
                </span>
                <span className="mt-3 text-xs font-bold text-ink md:text-sm">
                  Rp {product.price.toLocaleString("id-ID")}
                </span>
              </span>
            </button>
          ))
        )}
      </div>
    </section>
  );
}
