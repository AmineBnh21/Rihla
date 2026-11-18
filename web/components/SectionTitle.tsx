type SectionTitleProps = {
  first: string;
  second: string;
  /** Niveau du titre : h1 pour le hero, h2 par défaut. */
  as?: "h1" | "h2";
  /** `light` pour les fonds sombres. */
  tone?: "dark" | "light";
  id?: string;
  className?: string;
};

/** Titre sur deux tons : 1re ligne en `ink`, 2e ligne en `ink-soft`. */
export default function SectionTitle({
  first,
  second,
  as = "h2",
  tone = "dark",
  id,
  className = "",
}: SectionTitleProps) {
  const Tag = as;
  const size = as === "h1" ? "text-5xl md:text-7xl" : "text-4xl md:text-6xl";
  const firstColor = tone === "light" ? "text-surface" : "text-ink";
  const secondColor = tone === "light" ? "text-surface/80" : "text-ink-soft";
  return (
    <Tag id={id} className={`${size} font-medium leading-[1.05] tracking-tight ${className}`}>
      <span className={`block ${firstColor}`}>{first}</span>
      <span className={`block ${secondColor}`}>{second}</span>
    </Tag>
  );
}
