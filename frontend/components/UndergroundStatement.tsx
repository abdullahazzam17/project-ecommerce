"use client";

import Image from "next/image";
import graffitiWall from "@/assets/wall_grafiti.jpg";
import SectionLabel from "./SectionLabel";

export default function UndergroundStatement() {
  return (
    <section
      aria-labelledby="underground-heading"
      className="relative isolate overflow-hidden bg-ink text-inverse"
    >
      <Image
        src={graffitiWall}
        alt=""
        aria-hidden="true"
        fill
        sizes="100vw"
        className="object-cover object-center"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-ink/80" />

      <div className="relative mx-auto flex min-h-[72svh] max-w-[1440px] flex-col justify-between px-[20px] py-14 md:px-12 md:py-20">
        <SectionLabel index="06" label="Underground" tone="dark" />

        <div className="mt-16">
          <span
            aria-hidden="true"
            style={{ WebkitTextStroke: "1px rgba(246, 243, 236, 0.45)" }}
            className="pointer-events-none block select-none break-words text-[clamp(3rem,14vw,11rem)] font-black uppercase leading-[0.78] tracking-[-0.05em] text-transparent"
          >
            Street
          </span>
          <h2
            id="underground-heading"
            className="mt-2 break-words text-[clamp(2rem,6vw,5rem)] font-black uppercase leading-[0.9] tracking-[-0.03em]"
          >
            Street series
          </h2>
          <p className="mt-4 max-w-md text-sm text-inverse/75">
            Graffiti wall, campaign 01.
          </p>
        </div>

        <div className="mt-14 flex items-center justify-between gap-4 border-t border-inverse/20 pt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-inverse/60">
          <span>Zoom Cloth</span>
          <span>Noise / form</span>
        </div>
      </div>
    </section>
  );
}
