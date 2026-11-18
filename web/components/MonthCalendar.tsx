import { copy } from "@/lib/copy";
import { formatEuro } from "@/lib/format";
import type { CalendarDay } from "@/lib/types";

type Tier = "cheap" | "mid" | "expensive";

const tierClasses: Record<Tier, string> = {
  cheap: "bg-status-book/15",
  mid: "bg-status-watch/15",
  expensive: "bg-primary/15",
};

/** Classement visuel seulement (tiers par rang de prix), comme PriceCalendar. */
function tiersByRank(days: CalendarDay[]): Map<string, Tier> {
  const sorted = [...days].sort((a, b) => a.price_eur - b.price_eur);
  const tiers = new Map<string, Tier>();
  sorted.forEach((d, i) => {
    const pos = sorted.length > 1 ? i / (sorted.length - 1) : 0;
    tiers.set(d.date, pos < 1 / 3 ? "cheap" : pos < 2 / 3 ? "mid" : "expensive");
  });
  return tiers;
}

/**
 * Calendrier d'un mois (lundi en premier) : chaque jour avec son prix famille
 * lu dans `advice.calendar`, ou vide si on n'a pas de prix ce jour-là.
 * `month` : « AAAA-MM ».
 */
export default function MonthCalendar({ month, days }: { month: string; days: CalendarDay[] }) {
  const [year, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, m - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, m, 0)).getUTCDate();
  const offset = (first.getUTCDay() + 6) % 7; // lundi = 0
  const prices = new Map(days.map((d) => [d.date, d.price_eur]));
  const tiers = tiersByRank(days);
  const minPrice = days.length > 0 ? Math.min(...days.map((d) => d.price_eur)) : null;

  if (days.length === 0) {
    return <p className="text-base text-ink-soft md:text-lg">{copy.result.calendarEmpty}</p>;
  }

  const cells: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-7 gap-1 md:gap-2" role="grid" aria-label={copy.calendar.gridLabel}>
        {copy.calendar.weekdays.map((w) => (
          <div key={w} role="columnheader" className="pb-1 text-center text-sm font-medium text-ink-soft">
            {w}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} aria-hidden="true" />;
          const iso = `${month}-${String(day).padStart(2, "0")}`;
          const price = prices.get(iso);
          const tier = tiers.get(iso);
          const isMin = price !== undefined && price === minPrice;
          return (
            <div
              key={iso}
              role="gridcell"
              className={`flex min-h-16 flex-col justify-between rounded-xl p-1.5 md:min-h-20 md:rounded-2xl md:p-2.5 ${
                tier ? tierClasses[tier] : "bg-surface-muted"
              } ${isMin ? "ring-2 ring-status-book" : ""}`}
            >
              <span className="text-sm font-medium text-ink">{day}</span>
              {price !== undefined ? (
                <span className="text-sm font-semibold tracking-tight text-ink md:text-base">
                  {formatEuro(price)}
                  {tier && <span className="sr-only"> ({copy.calendar[tier]})</span>}
                  {isMin && <span className="sr-only"> {copy.calendar.cheapest}</span>}
                </span>
              ) : (
                <span className="text-sm text-ink-soft">
                  <span aria-hidden="true">–</span>
                  <span className="sr-only">{copy.calendar.noPrice}</span>
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2" aria-hidden="true">
        {(["cheap", "mid", "expensive"] as const).map((t) => (
          <span key={t} className="flex items-center gap-2 text-sm text-ink-soft">
            <span className={`size-4 rounded-md ${tierClasses[t]}`} />
            {copy.calendar[t]}
          </span>
        ))}
        <span className="text-sm text-ink-soft">{copy.calendar.noPriceLegend}</span>
      </div>
    </div>
  );
}
