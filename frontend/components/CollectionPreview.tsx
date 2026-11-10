"use client";

import type { Product } from "../lib/types";

interface CollectionPreviewProps {
  products: Product[];
  loading: boolean;
  error: boolean;
  demoMode: boolean;
  onRetry: () => void;
  onSelectProduct: (product: Product) => void;
  onViewAll: () => void;
  onExploreLookbook: () => void;
}

export default function CollectionPreview({
  products,
  loading,
  error,
  demoMode,
  onRetry,
  onSelectProduct,
  onViewAll,
  onExploreLookbook,
}: CollectionPreviewProps) {
  const items = products.slice(0, 4);
  const gridClass =
    items.length === 1
      ? "grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6"
      : "grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6";
  const noteSpanClass =
    items.length === 1
      ? "col-span-1"
      : items.length === 2
        ? "col-span-2 md:col-span-2"
        : "col-span-2 md:col-span-1";

  return (
    <section aria-labelledby="collection-heading" className="border-y border-line bg-surface">
      <div className="mx-auto max-w-[1440px] px-[20px] py-16 md:px-12 md:py-24">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-5">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-muted">
              <span aria-hidden="true" className="mr-2 inline-block h-1.5 w-1.5 bg-accent align-middle" />
              03 / Collection
            </p>
            <h2
              id="collection-heading"
              className="mt-3 break-words text-[clamp(2rem,5vw,4.5rem)] font-black uppercase leading-[0.9] tracking-[-0.03em]"
            >
              Latest pieces
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {demoMode ? (
              <span className="border border-ink px-2 py-1 font-mono text-[9px] font-black uppercase tracking-[0.18em]">
                Demo preview
              </span>
            ) : null}
            <button
              type="button"
              onClick={onViewAll}
              className="min-h-11 border-b border-ink pb-1 text-xs font-bold uppercase tracking-widest transition-opacity duration-200 hover:opacity-60"
            >
              View all
            </button>
          </div>
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
          <div role="alert" className="mt-8 border border-line bg-canvas p-6">
            <p className="text-sm font-bold">Products could not be loaded.</p>
            <p className="mt-1 text-sm text-muted">
              The store service is not reachable. Try again when it is running.
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 min-h-11 border border-ink px-5 text-xs font-bold uppercase tracking-widest transition-colors duration-200 hover:bg-surface"
            >
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="mt-8 border border-line bg-canvas p-8 md:p-12">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
              Collection 01
            </p>
            <p className="mt-3 max-w-md text-2xl font-black uppercase leading-tight md:text-3xl">
              The next collection is being prepared.
            </p>
            <button
              type="button"
              onClick={onExploreLookbook}
              className="mt-6 min-h-11 border border-ink px-5 text-xs font-bold uppercase tracking-widest transition-colors duration-200 hover:bg-surface"
            >
              Explore lookbook
            </button>
          </div>
        ) : (
          <ul className={`mt-8 ${gridClass}`}>
            {items.map((product) => (
              <li key={product.id}>
                <button
                  type="button"
                  onClick={() => onSelectProduct(product)}
                  className="group block w-full text-left"
                >
                  <span className="relative block aspect-[4/5] overflow-hidden bg-[#e6e2d9]">
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
                    {product.isDemo ? (
                      <span className="absolute left-2 top-2 bg-ink px-2 py-1 font-mono text-[8px] font-black uppercase tracking-[0.18em] text-inverse">
                        Demo
                      </span>
                    ) : null}
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
            {items.length < 4 ? (
              <li className={noteSpanClass}>
                <div className="relative flex h-full min-w-0 flex-col justify-between break-words border border-line bg-canvas p-5 md:p-8">
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
                    <button
                      type="button"
                      onClick={onExploreLookbook}
                      className="mt-5 min-h-11 border border-ink px-4 text-[10px] font-bold uppercase tracking-widest transition-colors duration-200 hover:bg-surface"
                    >
                      Explore lookbook
                    </button>
                  </div>
                </div>
              </li>
            ) : null}
          </ul>
        )}
      </div>
    </section>
  );
}
