import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { photos } from "@/lib/photos";
import PillButton from "@/components/PillButton";

export type BentoItem = {
  icon: LucideIcon;
  title: string;
  text: string;
};

type BentoGridProps = {
  /** Grande carte photo. */
  intro: { title: string; text: string };
  items: BentoItem[];
  cta: { title: string; text: string; href: string; label: string };
};

/** Grille de cartes de tailles différentes : grande carte, petites cartes à icône, carte bordeaux. */
export default function BentoGrid({ intro, items, cta }: BentoGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <article className="relative isolate flex min-h-80 flex-col justify-end gap-3 overflow-hidden rounded-3xl bg-ink p-8 md:col-span-2 md:row-span-2">
        <Image
          src={photos.airport.src}
          alt={photos.airport.alt}
          fill
          sizes="(min-width: 768px) 600px, 100vw"
          className="-z-20 object-cover"
        />
        {/* Voile neutre sous le texte. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-linear-to-t from-ink/90 via-ink/50 to-ink/10"
        />
        <h3 className="text-2xl font-medium leading-[1.05] tracking-tight text-surface md:text-3xl">
          {intro.title}
        </h3>
        <p className="text-base text-surface/85 md:text-lg">{intro.text}</p>
      </article>

      {items.map(({ icon: Icon, title, text }) => (
        <article key={title} className="reveal flex flex-col gap-4 rounded-3xl bg-surface-muted p-6">
          <span
            aria-hidden="true"
            className="flex size-11 items-center justify-center rounded-full bg-surface"
          >
            <Icon className="size-5 text-accent" />
          </span>
          <h3 className="text-xl font-medium tracking-tight text-ink">{title}</h3>
          <p className="text-base text-ink-soft">{text}</p>
        </article>
      ))}

      <article className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-primary p-8 md:col-span-4 md:flex-row md:items-center">
        <div className="flex flex-col gap-2">
          <h3 className="text-2xl font-medium leading-[1.05] tracking-tight text-surface md:text-3xl">
            {cta.title}
          </h3>
          <p className="text-base text-surface/90 md:text-lg">{cta.text}</p>
        </div>
        <PillButton href={cta.href} variant="secondary" className="focus-visible:outline-surface">
          {cta.label}
        </PillButton>
      </article>
    </div>
  );
}
