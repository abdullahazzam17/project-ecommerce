"use client";

import Image from "next/image";

interface HeroViewProps {
  onShopNow: () => void;
  onViewLookbook: () => void;
}

// Design Read: apparel storefront untuk pembeli urban, bahasa visual editorial streetwear,
// dial ENERGY 3 / RHYTHM 3 / MOTION 1. Hero memakai foto kampanye asli Zoom Cloth.
export default function HeroView({ onShopNow, onViewLookbook }: HeroViewProps) {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative isolate overflow-hidden bg-ink text-inverse"
    >
      <div className="absolute inset-0">
        <Image
          src="/hero-model-1400.jpg"
          alt="Model wearing Zoom Cloth apparel against a graffiti wall"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_18%]"
        />
        {/* Scrim fotografi: hanya untuk keterbacaan teks, bukan dekorasi. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/10 md:bg-gradient-to-r md:from-ink/95 md:via-ink/55 md:to-transparent"
        />
      </div>

      <div className="relative mx-auto flex min-h-[88svh] max-w-[1440px] flex-col justify-end px-[20px] pb-10 pt-28 md:min-h-[92svh] md:justify-between md:px-12 md:pb-14 md:pt-16">
        <div className="flex items-center justify-between gap-4 font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-inverse/80">
          <span>Zoom Cloth</span>
          <span className="hidden md:inline">Campaign 01 / 2026</span>
        </div>

        <div className="mt-16 max-w-5xl md:mt-0">
          <h1
            id="hero-heading"
            className="break-words text-[clamp(3.2rem,11vw,9.5rem)] font-black uppercase leading-[0.82] tracking-[-0.045em]"
          >
            Zoom
            <br />
            <span className="md:pl-[1.15em]">Cloth</span>
          </h1>
          <p className="mt-6 max-w-md text-base text-inverse/80 md:text-lg">
            Tops, hoodies, and print.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onShopNow}
              className="inline-flex min-h-12 w-full items-center justify-center bg-inverse px-6 text-xs font-bold uppercase tracking-widest text-ink transition-colors duration-200 hover:bg-white focus-visible:outline-inverse active:bg-[#e9e6de] sm:w-auto"
            >
              Shop collection
            </button>
            <button
              type="button"
              onClick={onViewLookbook}
              className="inline-flex min-h-12 w-full items-center justify-center border border-inverse/70 px-6 text-xs font-bold uppercase tracking-widest text-inverse transition-colors duration-200 hover:bg-inverse hover:text-ink focus-visible:outline-inverse sm:w-auto"
            >
              Explore lookbook
            </button>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between gap-4 border-t border-inverse/20 pt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-inverse/60">
          <span>Campaign 01</span>
          <span className="hidden sm:inline">Street series</span>
          <span>Scroll</span>
        </div>
      </div>
    </section>
  );
}
