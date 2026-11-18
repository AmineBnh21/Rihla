import { Info } from "lucide-react";
import { copy } from "@/lib/copy";

/** Bandeau visible quand les données affichées sont fictives (mock). */
export default function DemoBanner() {
  return (
    <div
      role="note"
      aria-label={copy.demo.title}
      className="flex items-start gap-3 rounded-3xl border-2 border-accent bg-surface p-4 md:items-center"
    >
      <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent md:mt-0" />
      <p className="text-sm text-ink md:text-base">
        <strong className="font-semibold uppercase tracking-wide">{copy.demo.title}</strong>
        <span className="mx-2" aria-hidden="true">·</span>
        {copy.demo.text}
      </p>
    </div>
  );
}
