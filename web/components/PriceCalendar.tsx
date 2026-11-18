import { copy } from "@/lib/copy";
import { formatDayShortMonth, formatEuro, formatWeekday } from "@/lib/format";
import type { CalendarDay } from "@/lib/types";

type Tier = "cheap" | "mid" | "expensive";

const tierClasses: Record<Tier, string> = {
  cheap: "bg-status-book/15 border-status-book/40",
  mid: "bg-status-watch/15 border-status-watch/40",
  expensive: "bg-primary/15 border-primary/40",
};

/**
 * Classement visuel uniquement : chaque jour est rangé en tiers
 * (moins cher, moyen, plus cher) selon son rang parmi les prix affichés.
 */
function tiersByRank(days: CalendarDay[]): Map<string, Tier> {
  const sorted = [...days].sort((a, b) => a.price_eur - b.price_eur);
  const tiers = new Map<string, Tier>();
  sorted.forEach((d, i) => {
    const pos = sorted.length > 1 ? i / (sorted.length - 1) : 0;
    tiers.set(d.date, pos < 1 / 3 ? "cheap" : pos < 2 / 3 ? "mid" : "expensive");
  });
  return tiers;
}

/** Grille des jours de départ, lue telle quelle dans `advice.calendar`. */
export default function PriceCalendar({ days }: { days: CalendarDay[] }) {
  if (days.length === 0) {
    return <p className="text-base text-ink-soft md:text-lg">{copy.result.calendarEmpty}</p>;
  }

  const tiers = tiersByRank(days);
  const minPrice = Math.min(...days.map((d) => d.price_eur));

  return (
    <div className="flex flex-col gap-6">
      <ul
        aria-label={copy.calendar.gridLabel}
        className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6"
      >
        {days.map((d) => {
          const tier = tiers.get(d.date) ?? "mid";
          const isCheapest = d.price_eur === minPrice;
          return (
            <li
              key={d.date}
              className={`flex flex-col gap-1 rounded-2xl p-3 ${tierClasses[tier]} ${isCheapest ? "border-2 border-status-book" : "border"}`}
            >
              <span className="text-sm text-ink-soft">
                {formatWeekday(d.date)}
              </span>
              <span className="text-sm font-medium text-ink">{formatDayShortMonth(d.date)}</span>
              <span className="text-lg font-semibold tracking-tight text-ink">
                {formatEuro(d.price_eur)}
              </span>
              <span className="sr-only">{copy.calendar[tier]}</span>
              {isCheapest && (
                <span className="text-sm font-medium text-ink">{copy.calendar.cheapest}</span>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2" aria-hidden="true">
        <span className="text-sm text-ink-soft">
          {copy.calendar.legendLabel}
        </span>
        {(["cheap", "mid", "expensive"] as const).map((t) => (
          <span key={t} className="flex items-center gap-2 text-sm text-ink-soft">
            <span className={`size-4 rounded-md border ${tierClasses[t]}`} />
            {copy.calendar[t]}
          </span>
        ))}
      </div>
    </div>
  );
}
