interface SectionLabelProps {
  index?: string;
  label: string;
  tone?: "light" | "dark";
}

export default function SectionLabel({ index, label, tone = "light" }: SectionLabelProps) {
  const toneClass = tone === "dark" ? "text-inverse/60" : "text-muted";

  return (
    <p
      className={`font-mono text-[11px] font-bold uppercase tracking-[0.22em] ${toneClass}`}
    >
      <span
        aria-hidden="true"
        className="mr-2 inline-block h-1.5 w-1.5 bg-accent align-middle"
      />
      {index ? `${index} / ` : ""}
      {label}
    </p>
  );
}
