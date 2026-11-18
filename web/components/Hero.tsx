import Image from "next/image";
import Eyebrow from "@/components/Eyebrow";
import PillButton from "@/components/PillButton";
import SectionTitle from "@/components/SectionTitle";
import { copy } from "@/lib/copy";
import { photos } from "@/lib/photos";

export type HeroStat = {
  value: string;
  label: string;
};

type HeroProps = {
  /** Chiffres clés lus dans les données ; rien n'est affiché si la liste est vide. */
  stats: HeroStat[];
};

/**
 * Grande carte d'accueil : photo plein cadre de la baie d'Oran (licence libre,
 * voir lib/photos.ts) et voile sombre en dégradé pour la lisibilité du texte.
 */
export default function Hero({ stats }: HeroProps) {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden rounded-[32px] bg-ink"
    >
      <Image
        src={photos.oran.src}
        alt={photos.oran.alt}
        fill
        priority
        sizes="(min-width: 1200px) 1200px, 100vw"
        className="hero-photo -z-20 object-cover object-[50%_60%]"
      />
      {/* Voile sombre neutre sous le texte, pour la lisibilité (seul dégradé autorisé). */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-ink/45" />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-linear-to-t from-ink/80 via-ink/30 to-ink/10"
      />

      <div className="flex min-h-140 flex-col justify-between gap-12 p-8 md:min-h-160 md:p-12">
        <div className="flex max-w-3xl flex-col gap-6">
          <Eyebrow tone="light">{copy.hero.eyebrow}</Eyebrow>
          <SectionTitle
            as="h1"
            id="hero-title"
            tone="light"
            first={copy.hero.titleFirst}
            second={copy.hero.titleSecond}
          />
          <p className="max-w-xl text-base text-surface/90 md:text-lg">{copy.hero.text}</p>
          <div>
            <PillButton href="#recherche" variant="secondary">
              {copy.hero.cta}
            </PillButton>
          </div>
        </div>

        {stats.length > 0 && (
          <dl
            aria-label={copy.hero.statsLabel}
            className="grid grid-cols-1 gap-6 sm:grid-cols-3"
          >
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col-reverse gap-1">
                <dt className="text-base text-surface/85">{s.label}</dt>
                <dd className="text-4xl font-normal tracking-tight text-surface md:text-5xl">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
