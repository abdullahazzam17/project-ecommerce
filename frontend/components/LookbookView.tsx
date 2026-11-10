"use client";

export default function LookbookView() {
  return (
    <section className="mx-auto w-full max-w-[1440px] flex-1 bg-canvas px-[20px] py-10 md:px-12 md:py-14">
      <div className="border-b border-line pb-5">
        <h2 className="break-words text-[clamp(1.9rem,3.5vw,3rem)] font-black tracking-[-0.02em]">
          Lookbook
        </h2>
        <p className="mt-1 text-sm text-muted">Campaign imagery for the current collection.</p>
      </div>

      {/* Foto asli klien. Ganti dengan foto kampanye resmi saat tersedia. */}
      <figure className="mt-8 max-w-xl">
        <div className="aspect-[4/5] overflow-hidden bg-[#e6e2d9]">
          <img
            src="/hero-model-1400.jpg"
            alt="Zoom Cloth apparel worn by a model"
            width={1400}
            height={2488}
            className="h-full w-full object-cover"
          />
        </div>
        <figcaption className="mt-3 text-sm text-muted">Zoom Cloth</figcaption>
      </figure>
    </section>
  );
}
