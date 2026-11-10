"use client";

import Image from "next/image";
import fabricDetail from "@/assets/detai_fabric.jpg";

export default function MaterialDetail() {
  return (
    <section aria-labelledby="material-heading" className="border-b border-line bg-canvas">
      <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-[20px] py-16 md:grid-cols-12 md:gap-8 md:px-12 md:py-24">
        <div className="md:col-span-7 md:-ml-12">
          <div className="relative aspect-[4/5] overflow-hidden bg-[#e6e2d9] md:aspect-[5/6]">
            <Image
              src={fabricDetail}
              alt="Extreme close-up of a printed fabric surface"
              fill
              sizes="(min-width: 768px) 60vw, 100vw"
              placeholder="blur"
              className="object-cover"
            />
          </div>
        </div>

        <div className="md:col-span-4 md:col-start-9">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-muted">
            <span aria-hidden="true" className="mr-2 inline-block h-1.5 w-1.5 bg-accent align-middle" />
            04 / Detail
          </p>
          <h2
            id="material-heading"
            className="mt-3 break-words text-[clamp(2rem,4.5vw,3.5rem)] font-black uppercase leading-[0.9] tracking-[-0.03em]"
          >
            Print, up close.
          </h2>
          <p className="mt-5 max-w-sm text-sm text-muted md:text-base">
            A close look at the printed surface and texture.
          </p>
          <p className="mt-8 border-t border-line pt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
            Zoom Cloth / Campaign 01
          </p>
        </div>
      </div>
    </section>
  );
}
