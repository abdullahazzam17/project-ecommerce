"use client";

import { useState } from "react";
import type { Product } from "../lib/types";

interface DetailViewProps {
  product: Product;
  images: string[];
  isProcessing: boolean;
  onBack: () => void;
  onBuyNow: (size: string, quantity: number) => void;
  onAddToCart: (size: string, quantity: number) => void;
}

const SIZES = ["S", "M", "L", "XL", "XXL"];

export default function DetailView({
  product,
  images,
  isProcessing,
  onBack,
  onBuyNow,
  onAddToCart,
}: DetailViewProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState("L");
  const [quantity, setQuantity] = useState(1);

  const stock = Math.max(0, product.stock);
  const maxQuantity = Math.max(1, stock);
  const soldOut = stock === 0;
  const activeImage = images[currentImageIndex] ?? "/product-placeholder.svg";

  const decrease = () => setQuantity((current) => Math.max(1, current - 1));
  const increase = () => setQuantity((current) => Math.min(maxQuantity, current + 1));

  return (
    <section className="mx-auto w-full max-w-[1440px] flex-1 bg-canvas px-[20px] py-8 md:px-12 md:py-12">
      <button
        type="button"
        onClick={onBack}
        className="min-h-11 border-b border-ink pb-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] transition-opacity duration-200 hover:opacity-60"
      >
        Back to collection
      </button>

      <div className="mt-6 grid gap-8 md:grid-cols-12 md:gap-10">
        <div className="md:col-span-7">
          <div className="relative aspect-[4/5] overflow-hidden border border-line bg-[#e6e2d9]">
            <img
              key={activeImage}
              src={activeImage}
              alt={product.name}
              width={800}
              height={1000}
              className="h-full w-full object-cover"
            />

            {images.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
                  }
                  aria-label="Previous image"
                  className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-surface/90 text-sm font-bold transition-colors duration-200 hover:bg-ink hover:text-inverse"
                >
                  &#10094;
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
                  }
                  aria-label="Next image"
                  className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-surface/90 text-sm font-bold transition-colors duration-200 hover:bg-ink hover:text-inverse"
                >
                  &#10095;
                </button>
              </>
            ) : null}
          </div>

          {images.length > 1 ? (
            <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <button
                  key={`${image.slice(0, 24)}-${index}`}
                  type="button"
                  onClick={() => setCurrentImageIndex(index)}
                  aria-label={`Show image ${index + 1}`}
                  aria-pressed={index === currentImageIndex}
                  className={`h-20 w-16 shrink-0 overflow-hidden border transition-opacity duration-200 ${
                    index === currentImageIndex
                      ? "border-ink opacity-100"
                      : "border-line opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={image} alt="" width={64} height={80} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="md:col-span-5">
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
              {product.category}
            </p>
            {product.isDemo ? (
              <span className="border border-ink px-2 py-1 font-mono text-[9px] font-black uppercase tracking-[0.16em]">
                Demo preview
              </span>
            ) : null}
            {product.is_coming_soon ? (
              <span className="bg-ink px-2 py-1 font-mono text-[9px] font-black uppercase tracking-[0.16em] text-inverse">
                Coming soon
              </span>
            ) : null}
          </div>

          <h1 className="mt-3 break-words text-[clamp(1.9rem,4vw,3.25rem)] font-black uppercase leading-[0.95] tracking-[-0.03em]">
            {product.name}
          </h1>
          <p className="mt-3 text-xl font-bold">Rp {product.price.toLocaleString("id-ID")}</p>
          <p className="mt-1 text-sm text-muted">
            {soldOut ? "Out of stock" : `${stock} in stock`}
          </p>

          <p className="mt-5 border-t border-line pt-5 text-sm leading-relaxed text-muted">
            {product.description}
          </p>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-4">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]">Size</p>
              <p className="text-xs text-muted">S to XXL</p>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  aria-pressed={selectedSize === size}
                  className={`min-h-12 border text-xs font-bold transition-colors duration-200 ${
                    selectedSize === size
                      ? "border-ink bg-ink text-inverse"
                      : "border-line bg-surface text-ink hover:border-ink"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]">Quantity</p>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={decrease}
                disabled={quantity <= 1 || soldOut}
                aria-label="Decrease quantity"
                className="flex h-11 w-11 items-center justify-center border border-line text-sm font-bold transition-colors duration-200 hover:border-ink disabled:opacity-40"
              >
                -
              </button>
              <span aria-live="polite" className="min-w-10 text-center text-sm font-bold">
                {quantity}
              </span>
              <button
                type="button"
                onClick={increase}
                disabled={quantity >= maxQuantity || soldOut}
                aria-label="Increase quantity"
                className="flex h-11 w-11 items-center justify-center border border-line text-sm font-bold transition-colors duration-200 hover:border-ink disabled:opacity-40"
              >
                +
              </button>
              <span className="text-xs text-muted">Max {maxQuantity}</span>
            </div>
          </div>

          {product.isDemo ? (
            <p className="mt-6 border border-line bg-surface p-3 text-xs text-muted">
              Demo item. Checkout is disabled in preview.
            </p>
          ) : null}

          <div className="mt-6 space-y-3">
            {product.is_coming_soon || soldOut ? (
              <button
                type="button"
                disabled
                className="w-full border border-line bg-canvas py-4 text-xs font-black uppercase tracking-widest text-muted"
              >
                {product.is_coming_soon ? "Coming soon" : "Out of stock"}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onBuyNow(selectedSize, quantity)}
                  disabled={isProcessing}
                  className="w-full bg-ink py-4 text-xs font-black uppercase tracking-widest text-inverse transition-colors duration-200 hover:bg-[#2b2b2b] disabled:opacity-50"
                >
                  {isProcessing ? "Processing..." : "Buy now"}
                </button>
                <button
                  type="button"
                  onClick={() => onAddToCart(selectedSize, quantity)}
                  className="w-full border border-ink py-4 text-xs font-black uppercase tracking-widest transition-colors duration-200 hover:bg-surface"
                >
                  Add to cart
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
