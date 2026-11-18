import Eyebrow from "@/components/Eyebrow";
import PillButton from "@/components/PillButton";
import { aviasalesSearchUrl } from "@/lib/affiliate";
import { copy } from "@/lib/copy";
import { formatDayMonth } from "@/lib/format";
import type { Advice } from "@/lib/types";

type AffiliateCtaProps = {
  advice: Advice;
  adults: number;
  /** Nombre d'enfants (pas `children`, réservé par React). */
  childCount: number;
};

/**
 * Lien partenaire Aviasales, pré-rempli avec le trajet, le jour le moins cher et la famille.
 * Toujours accompagné de la mention « lien partenaire ». Rien n'est affiché sans identifiant partenaire.
 */
export default function AffiliateCta({ advice, adults, childCount }: AffiliateCtaProps) {
  const days = advice.calendar ?? [];
  // Choix d'affichage : le jour le moins cher du calendrier lu dans `advice`.
  const cheapest = days.reduce<(typeof days)[number] | null>(
    (best, d) => (best === null || d.price_eur < best.price_eur ? d : best),
    null,
  );
  const mainUrl = cheapest
    ? aviasalesSearchUrl({
        origin: advice.origin,
        destination: advice.destination,
        date: cheapest.date,
        adults,
        children: childCount,
      })
    : null;

  const opt = advice.cheaper_option;
  const optUrl = opt
    ? aviasalesSearchUrl({
        origin: opt.origin,
        destination: opt.destination,
        date: opt.departure_date,
        adults,
        children: childCount,
      })
    : null;

  if (!mainUrl && !optUrl) return null;

  return (
    <section
      aria-labelledby="partenaire-title"
      className="reveal rounded-[32px] bg-surface p-8 md:p-12"
    >
      <div className="flex flex-col gap-6">
        <Eyebrow>{copy.affiliate.eyebrow}</Eyebrow>
        <h2
          id="partenaire-title"
          className="text-3xl font-medium leading-[1.05] tracking-tight text-ink md:text-4xl"
        >
          {copy.affiliate.title}
        </h2>
        <p className="max-w-2xl text-base text-ink-soft md:text-lg">{copy.affiliate.text}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {mainUrl && cheapest && (
            <PillButton href={mainUrl} external sponsored>
              {copy.affiliate.cheapestDay(formatDayMonth(cheapest.date))}
            </PillButton>
          )}
          {optUrl && opt && (
            <PillButton href={optUrl} external sponsored variant="secondary">
              {copy.affiliate.cheaperOption(formatDayMonth(opt.departure_date))}
            </PillButton>
          )}
        </div>
        <p className="text-sm text-ink-soft">{copy.affiliate.newTab}</p>
        <p className="max-w-2xl rounded-2xl bg-surface-muted px-5 py-4 text-sm text-ink">
          {copy.affiliate.disclosure}
        </p>
      </div>
    </section>
  );
}
