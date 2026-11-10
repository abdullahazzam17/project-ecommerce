"use client";

import { useMemo, useState } from "react";
import type { Product } from "../lib/types";

type SortKey = "featured" | "price-asc" | "price-desc" | "name";

interface CatalogViewProps {
  isComingSoon: boolean;
  category: string;
  filteredProducts: Product[];
  loading: boolean;
  error: boolean;
  demoMode: boolean;
  onRetry: () => void;
  onProductClick: (product: Product) => void;
  onSelectCategory: (category: string) => void;
}

const CATEGORY_TABS = [
  { label: "All products", value: "ALL" },
  { label: "Baju", value: "Baju" },
  { label: "Hoodie", value: "Hoodie" },
];

export default function CatalogView({
  isComingSoon,
  category,
  filteredProducts,
  loading,
  error,
  demoMode,
  onRetry,
  onProductClick,
  onSelectCategory,
}: CatalogViewProps) {
  const [sort, setSort] = useState<SortKey>("featured");

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    else if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [filteredProducts, sort]);

  const title = isComingSoon
    ? "Coming soon"
    : category === "ALL"
      ? "All products"
      : category;

  const gridClass =
    sortedProducts.length === 1
      ? "grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6"
      : "grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6";
  const noteSpanClass =
    sortedProducts.length === 1
      ? "col-span-1"
      : sortedProducts.length === 2
        ? "col-span-2 md:col-span-2"
        : "col-span-2 md:col-span-1";

  return (
    <section className="mx-auto w-full max-w-[1440px] flex-1 bg-canvas px-[20px] py-10 md:px-12 md:py-14">
      <div className="border-b border-line pb-5">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-muted">
          <span aria-hidden="true" className="mr-2 inline-block h-1.5 w-1.5 bg-accent align-middle" />
          Catalog
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="break-words text-[clamp(2rem,5vw,4.5rem)] font-black uppercase leading-[0.9] tracking-[-0.03em]">
              {title}
            </h2>
            <p className="mt-2 text-sm text-muted" aria-live="polite">
              {loading
                ? "Loading products"
                : error
                  ? "Products unavailable"
                  : `${sortedProducts.length} item${sortedProducts.length === 1 ? "" : "s"} available`}
            </p>
          </div>
          {demoMode ? (
            <span className="border border-ink px-2 py-1 font-mono text-[9px] font-black uppercase tracking-[0.16em]">
              Demo preview
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 border-b border-line pb-6 md:flex-row md:items-center md:justify-between">
        <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
          {CATEGORY_TABS.map((tab) => {
            const active = category === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => onSelectCategory(tab.value)}
                aria-pressed={active}
                className={`min-h-11 border px-4 font-mono text-[10px] font-bold uppercase tracking-[0.16em] transition-colors duration-200 ${
                  active
                    ? "border-ink bg-ink text-inverse"
                    : "border-line bg-surface text-ink hover:border-ink"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="catalog-sort" className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
            Sort
          </label>
          <select
            id="catalog-sort"
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
            className="min-h-11 border border-line bg-surface px-3 text-sm"
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      <div className={`mt-8 ${gridClass}`}>
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
              The store service is not reachable. Try again when it is running.
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 min-h-11 border border-ink px-5 text-xs font-bold uppercase tracking-widest transition-colors duration-200 hover:bg-canvas"
            >
              Retry
            </button>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="col-span-full border border-line bg-surface p-8 text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-muted">
              {isComingSoon ? "No coming soon products yet." : "No products in this view."}
            </p>
            <p className="mt-2 text-sm text-muted">
              Try another category or clear the current selection.
            </p>
          </div>
        ) : (
          sortedProducts.map((product) => (
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
                {product.isDemo ? (
                  <span className="absolute left-2 top-2 bg-ink px-2 py-1 font-mono text-[8px] font-black uppercase tracking-[0.16em] text-inverse">
                    Demo
                  </span>
                ) : null}
                {product.is_coming_soon ? (
                  <span className="absolute left-2 top-2 bg-ink px-2 py-1 text-[9px] font-black uppercase tracking-widest text-inverse">
                    Coming soon
                  </span>
                ) : null}
              </span>

              <span className="flex flex-1 flex-col justify-between p-3 md:p-4">
                <span className="line-clamp-2 break-words text-xs font-bold uppercase leading-tight tracking-tight md:text-sm">
                  {product.name}
                </span>
                <span className="mt-3 break-words text-xs font-bold text-ink md:text-sm">
                  Rp {product.price.toLocaleString("id-ID")}
                </span>
              </span>
            </button>
          ))
        )}

        {!loading && !error && sortedProducts.length > 0 && sortedProducts.length < 4 ? (
          <div
            className={`relative flex min-w-0 flex-col justify-between break-words border border-line bg-surface p-5 md:p-8 ${noteSpanClass}`}
          >
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
              {demoMode ? "Demo preview" : "Collection note"}
            </p>
            <span
              aria-hidden="true"
              style={{ WebkitTextStroke: "1px rgba(22, 22, 22, 0.18)" }}
              className="pointer-events-none select-none text-[clamp(3.5rem,7vw,6rem)] font-black leading-none text-transparent"
            >
              01
            </span>
            <div>
              <p className="text-lg font-black uppercase leading-tight md:text-xl">
                {demoMode ? "One sample product." : "More pieces soon."}
              </p>
              <p className="mt-2 text-xs text-muted">
                {demoMode
                  ? "Connect the store API to show real items."
                  : "New pieces will appear here."}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
