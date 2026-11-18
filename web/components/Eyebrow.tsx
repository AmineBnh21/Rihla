type EyebrowProps = {
  children: string;
  /** `light` pour les fonds sombres (hero, carte bordeaux). */
  tone?: "dark" | "light";
  className?: string;
};

/** Petit libellé en majuscules précédé d'un point orange entouré d'un anneau clair. */
export default function Eyebrow({ children, tone = "dark", className = "" }: EyebrowProps) {
  return (
    <p
      className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wide ${tone === "light" ? "text-surface" : "text-ink"} ${className}`}
    >
      <span
        aria-hidden="true"
        className="size-2 shrink-0 rounded-full bg-accent ring-4 ring-accent/20"
      />
      {children}
    </p>
  );
}
