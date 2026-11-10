"use client";

import Image from "next/image";
import secondaryCampaign from "@/assets/secondary_champaign.jpg";
import lookBehind from "@/assets/look_behind.jpg";
import imageAdd from "@/assets/image_add.jpg";

export default function EditorialStory() {
  return (
    <section aria-labelledby="editorial-heading" className="bg-canvas">
      <div className="mx-auto max-w-[1440px] px-[20px] py-16 md:px-12 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-5">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-muted">
              <span aria-hidden="true" className="mr-2 inline-block h-1.5 w-1.5 bg-accent align-middle" />
              02 / Editorial
            </p>
            <h2
              id="editorial-heading"
              className="mt-3 break-words text-[clamp(2rem,5vw,4.5rem)] font-black uppercase leading-[0.9] tracking-[-0.03em]"
            >
              Street study
            </h2>
          </div>
          <p className="max-w-xs text-sm text-muted">
            Campaign imagery from the current collection.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-8">
          <figure className="md:col-span-7">
            <div className="relative aspect-[4/5] overflow-hidden bg-[#e6e2d9]">
              <Image
                src={secondaryCampaign}
                alt="Model wearing a black Zoom Cloth graphic tee against a painted street wall"
                fill
                sizes="(min-width: 768px) 58vw, 100vw"
                placeholder="blur"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-3 flex justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              <span>01 / Campaign</span>
              <span>Street wall</span>
            </figcaption>
          </figure>

          <div className="md:col-span-4 md:col-start-9 md:mt-24">
            <figure>
              <div className="relative aspect-[3/4] overflow-hidden bg-[#e6e2d9]">
                <Image
                  src={lookBehind}
                  alt="Back view of an oversized Zoom Cloth graphic tee in a studio"
                  fill
                  sizes="(min-width: 768px) 32vw, 100vw"
                  placeholder="blur"
                  className="object-cover"
                />
              </div>
              <figcaption className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                02 / Back view
              </figcaption>
            </figure>

            <figure className="relative z-10 mt-6 md:-ml-20 md:mt-8">
              <div className="relative aspect-[3/4] overflow-hidden bg-[#e6e2d9]">
                <Image
                  src={imageAdd}
                  alt="Model at a graffiti door wearing a layered Zoom Cloth look"
                  fill
                  sizes="(min-width: 768px) 28vw, 100vw"
                  placeholder="blur"
                  className="object-cover"
                />
              </div>
              <figcaption className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                03 / Street series
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
