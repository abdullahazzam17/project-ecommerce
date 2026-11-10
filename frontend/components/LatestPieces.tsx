"use client";

import type { Product } from "../lib/types";

interface LatestPiecesProps {
  products: Product[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onSelectProduct: (product: Product) => void;
  onViewAll: () => void;
}

export default function LatestPieces({
  products,
  loading,
  error,
  onRetry,
  onSelectProduct,
  onViewAll,
}: LatestPiecesProps) {
  const items = products.slice(0, 4);

  return (
    <section aria-labelledby="latest-heading" className="border-b border-line bg-canvas">
      <div className="mx-auto max-w-[1440px] px-[20px] py-14 md:px-12 md:py-20">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-5">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-muted">
              <span aria-hidden="true" className="mr-2 inline-block h-1.5 w-1.5 bg-accent align-middle" />
              Collection
            </p>
            <h2
              id="latest-heading"
              className="mt-2 break-words text-[clamp(1.9rem,3.5vw,3rem)] font-black tracking-[-0.02em]"
            >
              Latest pieces
            </h2>
          </div>
          <button
            type="button"
            onClick={onViewAll}
            className="min-h-11 border-b border-ink pb-1 text-sm font-bold uppercase tracking-widest transition-opacity duration-200 hover:opacity-60"
          >
            View all
          </button>
        </div>

        {loading ? (
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6" aria-busy="true">
            <p className="sr-only">Loading products</p>
            {[0, 1, 2, 3].map((slot) => (
              <div key={slot} className="animate-pulse">
                <div className="aspect-[4/5] bg-[#e6e2d9]" />
                <div className="mt-3 h-3 w-3/4 bg-[#e6e2d9]" />
                <div className="mt-2 h-3 w-1/3 bg-[#e6e2d9]" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="mt-8 border border-line bg-surface p-6">
            <p className="text-sm font-bold">Products could not be loaded.</p>
            <p className="mt-1 text-sm text-muted">
              Check that the store service is running, then try again.
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 min-h-11 border border-ink px-[20px] text-xs font-bold uppercase tracking-widest transition-colors duration-200 hover:bg-canvas"
            >
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <p className="mt-8 text-sm text-muted">No products are available yet.</p>
        ) : (
          <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {items.map((product) => (
              <li key={product.id}>
                <button
                  type="button"
                  onClick={() => onSelectProduct(product)}
                  className="group block w-full text-left"
                >
                  <span className="block aspect-[4/5] overflow-hidden bg-[#e6e2d9]">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        width={600}
                        height={750}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-xs text-muted">
                        No image
                      </span>
                    )}
                  </span>
                  <span className="mt-3 block break-words text-sm font-bold uppercase tracking-tight">
                    {product.name}
                  </span>
                  <span className="mt-1 block break-words text-sm text-muted">
                    Rp {product.price.toLocaleString("id-ID")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
