"use client";

import Image from "next/image";
import SectionLabel from "./SectionLabel";
import secondaryCampaign from "@/assets/secondary_champaign.jpg";
import lookBehind from "@/assets/look_behind.jpg";
import imageAdd from "@/assets/image_add.jpg";

const captionClass =
  "mb-2 flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted";

export default function EditorialStory() {
  return (
    <section aria-labelledby="editorial-heading" className="bg-canvas">
      <div className="mx-auto max-w-[1440px] px-[20px] py-16 md:px-12 md:py-24">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-5">
          <div>
            <SectionLabel index="02" label="Editorial" />
            <h2
              id="editorial-heading"
              className="mt-3 break-words text-[clamp(2rem,4.5vw,4rem)] font-black uppercase leading-[0.9] tracking-[-0.03em]"
            >
              Street study
            </h2>
          </div>
          <p className="max-w-xs text-sm text-muted">
            Campaign imagery from the current collection.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-12 md:items-stretch md:gap-6">
          <figure className="flex flex-col md:col-span-7">
            <figcaption className={captionClass}>
              <span>01 / Campaign</span>
              <span>Street wall</span>
            </figcaption>
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#e6e2d9]">
              <Image
                src={secondaryCampaign}
                alt="Model wearing a black Zoom Cloth graphic tee against a painted street wall"
                fill
                sizes="(min-width: 768px) 58vw, 100vw"
                placeholder="blur"
                className="object-cover"
              />
            </div>
          </figure>

          <div className="grid grid-cols-2 gap-3 md:col-span-5 md:h-full md:grid-cols-1 md:grid-rows-2 md:gap-4">
            <figure className="flex min-h-0 flex-col">
              <figcaption className={captionClass}>
                <span>02 / Back view</span>
                <span className="hidden sm:inline">Studio</span>
              </figcaption>
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#e6e2d9] md:aspect-auto md:min-h-0 md:flex-1">
                <Image
                  src={lookBehind}
                  alt="Back view of an oversized Zoom Cloth graphic tee in a studio"
                  fill
                  sizes="(min-width: 768px) 38vw, 50vw"
                  placeholder="blur"
                  className="object-cover"
                />
              </div>
            </figure>

            <figure className="flex min-h-0 flex-col">
              <figcaption className={captionClass}>
                <span>03 / Street series</span>
                <span className="hidden sm:inline">Doorway</span>
              </figcaption>
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#e6e2d9] md:aspect-auto md:min-h-0 md:flex-1">
                <Image
                  src={imageAdd}
                  alt="Model at a graffiti door wearing a layered Zoom Cloth look"
                  fill
                  sizes="(min-width: 768px) 38vw, 50vw"
                  placeholder="blur"
                  className="object-cover"
                />
              </div>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
