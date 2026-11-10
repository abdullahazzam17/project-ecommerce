"use client";

import SectionLabel from "./SectionLabel";

interface FooterProps {
  onHome: () => void;
  onShop: () => void;
  onLookbook: () => void;
}

export default function Footer({ onHome, onShop, onLookbook }: FooterProps) {
  return (
    <footer className="border-t border-line bg-ink text-inverse">
      <div className="mx-auto max-w-[1440px] px-[20px] py-14 md:px-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-6">
            <img
              src="/zoom-1-240.png"
              alt=""
              width={240}
              height={240}
              className="h-12 w-12 object-contain"
            />
            <button
              type="button"
              onClick={onHome}
              className="mt-4 block min-h-11 text-left text-2xl font-black uppercase tracking-tight transition-opacity duration-200 hover:opacity-70 focus-visible:outline-inverse"
            >
              Zoom Cloth
            </button>
            <p className="mt-2 max-w-sm text-sm text-inverse/70">
              Tops, hoodies, and print.
            </p>
          </div>

          <nav
            aria-label="Footer"
            className="flex flex-col gap-2 text-sm font-bold uppercase tracking-widest md:col-span-3"
          >
            <button
              type="button"
              onClick={onShop}
              className="min-h-11 text-left transition-opacity duration-200 hover:opacity-60 focus-visible:outline-inverse"
            >
              Shop
            </button>
            <button
              type="button"
              onClick={onLookbook}
              className="min-h-11 text-left transition-opacity duration-200 hover:opacity-60 focus-visible:outline-inverse"
            >
              Lookbooks
            </button>
            <a
              href="/admin/login"
              className="min-h-11 transition-opacity duration-200 hover:opacity-60 focus-visible:outline-inverse"
            >
              Admin
            </a>
          </nav>

          <div className="text-sm text-inverse/60 md:col-span-3">
            <SectionLabel index="07" label="Footer" tone="dark" />
            <p className="mt-2">Street series</p>
            <p className="mt-1">2026</p>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-inverse/20 pt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-inverse/50 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Zoom Cloth.</span>
          <span>Zoom Cloth / Street series</span>
        </div>
      </div>
    </footer>
  );
}
