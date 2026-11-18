import type { Metadata } from "next";
import Image from "next/image";
import Eyebrow from "@/components/Eyebrow";
import PillButton from "@/components/PillButton";
import RouteTrend from "@/components/RouteTrend";
import SectionTitle from "@/components/SectionTitle";
import { copy } from "@/lib/copy";
import { getLatestAdviceSnapshot } from "@/lib/data";
import { formatDateLong } from "@/lib/format";
import { photos } from "@/lib/photos";
import { ORIGINS, DESTINATIONS, EID_PERIODS } from "@/lib/types";

export const metadata: Metadata = {
  title: copy.observatory.metaTitle,
};

const routeOrder = (o: string, d: string) =>
  ORIGINS.indexOf(o as (typeof ORIGINS)[number]) * 10 +
  DESTINATIONS.indexOf(d as (typeof DESTINATIONS)[number]);

export default async function ObservatoryPage() {
  const { data: rows } = await getLatestAdviceSnapshot();
  const solo = rows.filter((r) => r.passengers === "1A");
  const computedAt = rows[0]?.computed_at ?? null;

  return (
    <>
      <section
        aria-labelledby="obs-title"
        className="grid grid-cols-1 gap-8 rounded-[32px] bg-surface p-8 md:p-12 lg:grid-cols-2 lg:items-center"
      >
        <div className="flex flex-col gap-6">
          <Eyebrow>{copy.observatory.eyebrow}</Eyebrow>
          <SectionTitle
            as="h1"
            id="obs-title"
            first={copy.observatory.titleFirst}
            second={copy.observatory.titleSecond}
          />
          <p className="max-w-2xl text-base text-ink-soft md:text-lg">{copy.observatory.intro}</p>
          {computedAt && (
            <p className="text-base text-ink-soft">
              {copy.observatory.updatedOn(formatDateLong(computedAt))}
            </p>
          )}
          <div>
            <PillButton href="/#recherche">{copy.nav.seePrices}</PillButton>
          </div>
        </div>
        <div className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-surface-muted">
          <Image
            src={photos.constantine.src}
            alt={photos.constantine.alt}
            fill
            priority
            sizes="(min-width: 1024px) 560px, 100vw"
            className="object-cover"
          />
        </div>
      </section>

      {EID_PERIODS.map((period) => {
        const items = solo
          .filter((r) => r.period === period)
          .sort((a, b) => routeOrder(a.origin, a.destination) - routeOrder(b.origin, b.destination));
        const titleId = `periode-${period}`;
        return (
          <section
            key={period}
            aria-labelledby={titleId}
            className="reveal rounded-[32px] bg-surface p-8 md:p-12"
          >
            <div className="mb-8 flex flex-col gap-4">
              <Eyebrow>{copy.observatory.periodEyebrow}</Eyebrow>
              <h2
                id={titleId}
                className="text-4xl font-medium leading-[1.05] tracking-tight text-ink md:text-6xl"
              >
                {copy.periods[period]}
              </h2>
            </div>
            {items.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {items.map((a) => (
                  <RouteTrend key={`${a.origin}-${a.destination}`} advice={a} />
                ))}
              </div>
            ) : (
              <p className="text-base text-ink-soft md:text-lg">{copy.observatory.empty}</p>
            )}
          </section>
        );
      })}

      <section className="rounded-[32px] bg-surface p-8 md:p-12">
        <p className="text-base text-ink-soft md:text-lg">{copy.observatory.historyNote}</p>
        <p className="mt-2 text-base font-medium text-ink">{copy.observatory.disclaimer}</p>
      </section>
    </>
  );
}
