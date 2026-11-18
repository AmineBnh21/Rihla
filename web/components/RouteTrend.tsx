import AdviceBadge from "@/components/AdviceBadge";
import PillButton from "@/components/PillButton";
import { copy } from "@/lib/copy";
import { formatDayShortMonth, formatEuro } from "@/lib/format";
import type { Advice } from "@/lib/types";

/**
 * Carte d'une ligne pour l'Observatoire : conseil du jour + barres des prix
 * par jour de départ, lues telles quelles dans `advice.calendar`.
 * La hauteur des barres est seulement une mise à l'échelle visuelle.
 */
export default function RouteTrend({ advice }: { advice: Advice }) {
  const route = `${copy.places[advice.origin]} → ${copy.places[advice.destination]}`;
  const days = advice.calendar ?? [];
  const max = days.length > 0 ? Math.max(...days.map((d) => d.price_eur)) : 0;
  const min = days.length > 0 ? Math.min(...days.map((d) => d.price_eur)) : 0;
  const cheapest = days.find((d) => d.price_eur === min);
  const href = `/resultat?${new URLSearchParams({
    from: advice.origin,
    to: advice.destination,
    period: advice.period,
    adults: "1",
    children: "0",
    bags: "0",
  }).toString()}`;

  return (
    <article className="flex flex-col gap-6 rounded-3xl bg-surface-muted p-6 md:p-8">
      <div className="flex flex-col gap-1">
        <h3 className="text-2xl font-medium tracking-tight text-ink">{route}</h3>
        {advice.price_eur !== null ? (
          <p className="text-base text-ink-soft">
            {copy.observatory.pricePrefix}{" "}
            <span className="text-3xl font-normal tracking-tight text-ink">
              {formatEuro(advice.price_eur)}
            </span>
            <span className="block text-sm">{copy.observatory.priceNote}</span>
          </p>
        ) : (
          <p className="text-base text-ink-soft">{copy.observatory.noPrice}</p>
        )}
      </div>

      <div className="origin-left scale-90">
        <AdviceBadge status={advice.status} />
      </div>
      <p className="text-base text-ink-soft">{advice.reason}</p>

      {days.length > 0 && (
        <figure className="flex flex-col gap-3">
          <ul
            aria-label={copy.observatory.chartLabel(route)}
            className="flex h-32 items-end gap-1"
          >
            {days.map((d) => {
              const pct = max > 0 ? Math.max(8, Math.round((d.price_eur / max) * 100)) : 0;
              const isMin = d.price_eur === min;
              return (
                <li
                  key={d.date}
                  className="flex h-full flex-1 items-end"
                  title={`${formatDayShortMonth(d.date)} : ${formatEuro(d.price_eur)}`}
                >
                  <span
                    aria-hidden="true"
                    className={`block w-full rounded-t-md ${isMin ? "bg-accent" : "bg-ink/20"}`}
                    style={{ height: `${pct}%` }}
                  />
                  <span className="sr-only">
                    {formatDayShortMonth(d.date)} : {formatEuro(d.price_eur)}
                  </span>
                </li>
              );
            })}
          </ul>
          <figcaption className="flex justify-between text-sm text-ink-soft">
            <span>{formatDayShortMonth(days[0].date)}</span>
            {cheapest && (
              <span className="font-medium text-ink">
                {copy.observatory.cheapestDay(formatDayShortMonth(cheapest.date))}
              </span>
            )}
            <span>{formatDayShortMonth(days[days.length - 1].date)}</span>
          </figcaption>
        </figure>
      )}

      <div className="mt-auto">
        <PillButton href={href} variant="secondary">
          {copy.observatory.seeDetail}
        </PillButton>
      </div>
    </article>
  );
}
