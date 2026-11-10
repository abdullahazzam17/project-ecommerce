"use client";

interface HeroViewProps {
  onShopNow: () => void;
  onViewLookbook: () => void;
}

// Design Read: storefront apparel untuk pembeli lokal, bahasa visual editorial streetwear,
// dial ENERGY 2 / RHYTHM 2 / MOTION 1 (sesuai DESIGN.md, tanpa slogan atau klaim fiktif).
export default function HeroView({ onShopNow, onViewLookbook }: HeroViewProps) {
  return (
    <section aria-labelledby="hero-heading" className="border-b border-line bg-canvas">
      <div className="mx-auto grid max-w-[1440px] items-stretch md:grid-cols-[1.05fr_1fr]">
        <div className="flex flex-col justify-center px-5 pb-12 pt-10 md:px-12 md:py-16">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-muted">
            <span aria-hidden="true" className="mr-2 inline-block h-1.5 w-1.5 bg-accent align-middle" />
            Zoom Cloth
          </p>

          <div className="mt-8 md:mt-10">
            <h1
              id="hero-heading"
              className="max-w-xl text-[clamp(2.6rem,6vw,5.5rem)] font-black leading-[0.95] tracking-[-0.03em]"
            >
              Everyday tops and hoodies.
            </h1>
            <p className="mt-5 max-w-md text-base text-muted">
              Browse the current collection.
            </p>

            <div className="mt-8 flex flex-col gap-3 lg:flex-row">
              <button
                type="button"
                onClick={onShopNow}
                className="inline-flex min-h-12 w-full items-center justify-center bg-ink px-7 text-sm font-bold uppercase tracking-widest text-inverse transition-colors duration-200 hover:bg-[#2b2b2b] active:bg-black lg:w-auto"
              >
                Shop collection
              </button>
              <button
                type="button"
                onClick={onViewLookbook}
                className="inline-flex min-h-12 w-full items-center justify-center border border-ink px-7 text-sm font-bold uppercase tracking-widest text-ink transition-colors duration-200 hover:bg-surface active:bg-[#e9e6de] lg:w-auto"
              >
                View lookbook
              </button>
            </div>
          </div>
        </div>

        <div className="relative min-h-[52vh] md:min-h-[70vh]">
          {/* Aset asli klien; versi 1400px (372 KB) disimpan terpisah dari original. */}
          <img
            src="/hero-model-1400.jpg"
            alt="Model wearing Zoom Cloth apparel"
            width={1400}
            height={2488}
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover object-[center_18%]"
          />
        </div>
      </div>
    </section>
  );
}
