"use client";

import Image from "next/image";
import SectionLabel from "./SectionLabel";
import productionImage from "@/assets/production.jpg";

interface ProductionStoryProps {
  onViewCollection: () => void;
}

export default function ProductionStory({ onViewCollection }: ProductionStoryProps) {
  return (
    <section aria-labelledby="production-heading" className="bg-ink text-inverse">
      <div className="mx-auto max-w-[1440px] px-[20px] py-16 md:px-12 md:py-24">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-stretch md:gap-10">
          <div className="flex flex-col justify-center md:col-span-6">
            <div>
              <SectionLabel index="05" label="Production" tone="dark" />
              <h2
                id="production-heading"
                className="mt-3 break-words text-[clamp(2.4rem,5vw,4.5rem)] font-black uppercase leading-[0.9] tracking-[-0.03em]"
              >
                Custom apparel and print.
              </h2>
              <p className="mt-5 max-w-md text-sm text-inverse/75 md:text-base">
                Zoom Cloth also works in apparel production and print. Process imagery is
                shown for reference.
              </p>
            </div>

            <div className="mt-8">
              <button
                type="button"
                onClick={onViewCollection}
                className="inline-flex min-h-12 items-center justify-center border border-inverse/70 px-7 text-xs font-bold uppercase tracking-widest text-inverse transition-colors duration-200 hover:bg-inverse hover:text-ink focus-visible:outline-inverse"
              >
                View collection
              </button>
            </div>
          </div>

          <div className="md:col-span-6">
            <div className="relative aspect-square overflow-hidden bg-[#242424]">
              <Image
                src={productionImage}
                alt="Screen printing process shown for reference"
                fill
                sizes="(min-width: 768px) 48vw, 100vw"
                placeholder="blur"
                className="object-cover"
              />
            </div>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-inverse/50">
              Process imagery / reference
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
