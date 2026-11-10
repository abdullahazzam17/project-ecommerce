"use client";

import type { Product } from "../lib/types";

interface CategorySectionProps {
  products: Product[];
  loading: boolean;
  error: boolean;
  onSelectCategory: (category: string) => void;
}

// Dua kategori disetujui klien: Baju dan Hoodie.
// Mapping sementara: produk non-hoodie masuk Baju sampai data kategori dirapikan (SRS D-03).
const CATEGORIES = [
  {
    id: "Baju",
    label: "Baju",
    description: "Everyday apparel",
    matches: (category: string) => !category.toLowerCase().includes("hoodie"),
  },
  {
    id: "Hoodie",
    label: "Hoodie",
    description: "Hoodies and outerwear",
    matches: (category: string) => category.toLowerCase().includes("hoodie"),
  },
];

export default function CategorySection({
  products,
  loading,
  error,
  onSelectCategory,
}: CategorySectionProps) {
  return (
    <section aria-labelledby="category-heading" className="border-b border-line bg-surface">
      <div className="mx-auto max-w-[1440px] px-5 py-14 md:px-12 md:py-20">
        <h2
          id="category-heading"
          className="text-[clamp(1.9rem,3.5vw,3rem)] font-black tracking-[-0.02em]"
        >
          Shop by category
        </h2>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {CATEGORIES.map((category) => {
            const count =
              loading || error
                ? null
                : products.filter((product) => category.matches(product.category)).length;

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onSelectCategory(category.id)}
                className="group flex min-h-40 flex-col justify-between border border-line bg-canvas p-6 text-left transition-colors duration-200 hover:border-ink hover:bg-[#ece9e1] md:p-8"
              >
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-muted">
                  {category.description}
                </span>
                <span className="mt-10 flex items-end justify-between gap-4">
                  <span className="text-3xl font-black tracking-tight md:text-4xl">
                    {category.label}
                  </span>
                  <span className="text-sm font-bold text-muted">
                    {count === null ? "" : `${count} item${count === 1 ? "" : "s"}`}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {!loading && !error && products.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No products are available yet.</p>
        ) : null}
      </div>
    </section>
  );
}
