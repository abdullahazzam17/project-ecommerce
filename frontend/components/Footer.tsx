"use client";

interface FooterProps {
  onHome: () => void;
  onShop: () => void;
  onLookbook: () => void;
}

export default function Footer({ onHome, onShop, onLookbook }: FooterProps) {
  return (
    <footer className="mt-auto border-t border-line bg-canvas">
      <div className="mx-auto max-w-[1440px] px-[20px] py-12 md:px-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <button
              type="button"
              onClick={onHome}
              className="text-lg font-black tracking-tight"
            >
              Zoom Cloth
            </button>
            <p className="mt-2 max-w-sm text-sm text-muted">
              Tops and hoodies. Browse the current collection.
            </p>
          </div>

          <nav
            aria-label="Footer"
            className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-bold uppercase tracking-widest"
          >
            <button type="button" onClick={onShop} className="min-h-11 transition-opacity duration-200 hover:opacity-60">
              Shop
            </button>
            <button type="button" onClick={onLookbook} className="min-h-11 transition-opacity duration-200 hover:opacity-60">
              Lookbooks
            </button>
            <a href="/admin/login" className="min-h-11 transition-opacity duration-200 hover:opacity-60">
              Admin
            </a>
          </nav>
        </div>

        <p className="mt-10 border-t border-line pt-6 text-xs text-muted">
          © 2026 Zoom Cloth.
        </p>
      </div>
    </footer>
  );
}
