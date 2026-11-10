"use client";

import { useState } from "react";
import type { Product } from "../lib/types";

interface DetailViewProps {
  product: Product;
  images: string[];
  isProcessing: boolean;
  // Size dipilih di dalam komponen ini; dikirim ke halaman saat aksi
  onBuyNow: (size: string) => void;
  onAddToCart: (size: string) => void;
}

export default function DetailView({ product, images, isProcessing, onBuyNow, onAddToCart }: DetailViewProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("L");

  return (
    <section className="mx-auto w-full max-w-[1440px] flex-1 bg-canvas p-5 md:p-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* SLIDER FOTO */}
        <div className="space-y-4">
          <div className="relative w-full aspect-square bg-[#e6e2d9] overflow-hidden rounded-sm border border-line">
            <img
              key={currentImageIndex}
              src={images[currentImageIndex]}
              alt={product.name}
              className="w-full h-full object-cover transition-all duration-500 ease-in-out animate-in fade-in zoom-in-95"
            />

            {images.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-surface/90 hover:bg-black hover:text-white text-ink p-3 rounded-full shadow-md font-bold text-xs transition-all duration-200 active:scale-90"
                >
                  &#10094;
                </button>
                <button
                  onClick={() =>
                    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-surface/90 hover:bg-black hover:text-white text-ink p-3 rounded-full shadow-md font-bold text-xs transition-all duration-200 active:scale-90"
                >
                  &#10095;
                </button>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`w-20 h-20 flex-shrink-0 border-2 rounded-sm overflow-hidden transition-all duration-200 ${
                    idx === currentImageIndex ? "border-black scale-105 shadow-md" : "border-line opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* DETAIL INFO & ACTION */}
        <div className="space-y-6">
          <div>
            <span className="text-xs font-bold text-muted tracking-widest uppercase flex items-center gap-2">
              {product.category}
              {product.is_coming_soon && (
                <span className="bg-ink text-white text-[9px] font-black px-2 py-0.5 rounded">
                  COMING SOON
                </span>
              )}
            </span>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-ink uppercase mt-1">
              {product.name}
            </h2>
            <p className="text-2xl font-bold text-ink mt-2">
              Rp {product.price.toLocaleString("id-ID")}
            </p>
            <p className="text-[10px] font-bold text-muted mt-1 uppercase">
              Stok tersedia: {product.stock}
            </p>
          </div>

          {/* SIZE SELECTION */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-bold">
              <span>SELECT SIZE</span>
              <span className="underline cursor-pointer hover:text-muted">Size Guide &gt;</span>
            </div>
            <div className="grid grid-cols-5 gap-2 md:gap-3">
              {["S", "M", "L", "XL", "XXL"].map((sz) => (
                <button
                  key={sz}
                  onClick={() => setSelectedSize(sz)}
                  className={`py-3 text-xs font-bold border rounded-sm transition-all duration-200 active:scale-95 ${
                    selectedSize === sz
                      ? "border-black bg-black text-white shadow-md"
                      : "border-line text-ink hover:border-black"
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* DESKRIPSI TEKS */}
          <div className="pt-2 border-t border-line">
            <span className="text-xs font-bold uppercase block mb-2">Description</span>
            <p className="text-xs md:text-sm text-muted leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* ACTION BUTTONS (DISABLE JIKA COMING SOON) */}
          <div className="space-y-3 pt-4">
            {product.is_coming_soon ? (
              <button
                disabled
                className="w-full bg-canvas border border-line text-muted font-black py-4 rounded-sm tracking-widest text-xs uppercase cursor-not-allowed"
              >
                COMING SOON - NOT AVAILABLE FOR PURCHASE YET
              </button>
            ) : (
              <>
                <button
                  onClick={() => onBuyNow(selectedSize)}
                  disabled={isProcessing}
                  className="w-full bg-black hover:bg-gray-800 text-white font-black py-4 rounded-sm tracking-widest text-sm uppercase shadow-xl transition-all duration-200 active:scale-98 disabled:opacity-50"
                >
                  {isProcessing ? "PROCESSING..." : "BUY NOW (DIRECT CHECKOUT)"}
                </button>

                <button
                  onClick={() => onAddToCart(selectedSize)}
                  className="w-full bg-surface border border-black text-ink hover:bg-gray-50 font-bold py-3.5 rounded-sm tracking-widest text-xs uppercase transition-all duration-200 active:scale-98"
                >
                  ADD TO CART BAG
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
