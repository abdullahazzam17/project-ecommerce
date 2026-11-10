"use client";

import Image from "next/image";
import secondaryCampaign from "@/assets/secondary_champaign.jpg";
import lookBehind from "@/assets/look_behind.jpg";
import imageAdd from "@/assets/image_add.jpg";
import SectionLabel from "./SectionLabel";

export default function LookbookView() {
  return (
    <section className="mx-auto w-full max-w-[1440px] flex-1 bg-canvas px-[20px] py-10 md:px-12 md:py-14">
      <div className="border-b border-line pb-5">
        <SectionLabel label="Lookbook" />
        <h2 className="mt-3 break-words text-[clamp(2rem,4.5vw,4rem)] font-black uppercase leading-[0.9] tracking-[-0.03em]">
          Campaign 01
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted">
          Street imagery from the current collection.
        </p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-12 md:gap-8">
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

        <div className="grid grid-cols-2 gap-6 md:col-span-4 md:col-start-9 md:grid-cols-1">
          <figure>
            <div className="relative aspect-[3/4] overflow-hidden bg-[#e6e2d9]">
              <Image
                src={lookBehind}
                alt="Back view of an oversized Zoom Cloth graphic tee in a studio"
                fill
                sizes="(min-width: 768px) 32vw, 50vw"
                placeholder="blur"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              02 / Back view
            </figcaption>
          </figure>

          <figure className="md:mt-6">
            <div className="relative aspect-[3/4] overflow-hidden bg-[#e6e2d9]">
              <Image
                src={imageAdd}
                alt="Model at a graffiti door wearing a layered Zoom Cloth look"
                fill
                sizes="(min-width: 768px) 32vw, 50vw"
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
    </section>
  );
}
