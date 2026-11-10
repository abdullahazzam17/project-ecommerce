"use client";

import Image from "next/image";
import SectionLabel from "./SectionLabel";
import fabricDetail from "@/assets/detai_fabric.jpg";

export default function MaterialDetail() {
  return (
    <section aria-labelledby="material-heading" className="border-b border-line bg-canvas">
      <div className="mx-auto max-w-[1440px] px-[20px] py-16 md:px-12 md:py-24">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-stretch">
          <div className="md:col-span-7">
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#e6e2d9] md:aspect-square">
              <Image
                src={fabricDetail}
                alt="Extreme close-up of a printed fabric surface"
                fill
                sizes="(min-width: 768px) 58vw, 100vw"
                placeholder="blur"
                className="object-cover"
              />
            </div>
          </div>

          <div className="flex flex-col justify-center border-t border-line pt-5 md:col-span-5 md:border-l md:border-t-0 md:pl-8 md:pt-0">
            <div>
              <SectionLabel index="04" label="Detail" />
              <h2
                id="material-heading"
                className="mt-3 break-words text-[clamp(2rem,4vw,3.5rem)] font-black uppercase leading-[0.9] tracking-[-0.03em]"
              >
                Print, up close.
              </h2>
              <p className="mt-5 max-w-sm text-sm text-muted md:text-base">
                A close look at the printed surface and texture.
              </p>
            </div>

            <div className="mt-8 border-t border-line pt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
              <div className="flex items-center justify-between gap-4">
                <span>Zoom Cloth</span>
                <span>Campaign 01</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
