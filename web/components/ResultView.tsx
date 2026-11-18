import Image from "next/image";
import { headers } from "next/headers";
import { MessageCircle } from "lucide-react";
import AdviceBadge from "@/components/AdviceBadge";
import AffiliateCta from "@/components/AffiliateCta";
import Eyebrow from "@/components/Eyebrow";
import PillButton from "@/components/PillButton";
import MonthCalendar from "@/components/MonthCalendar";
import PriceCalendar from "@/components/PriceCalendar";
import ResultMessage from "@/components/ResultMessage";
import SectionTitle from "@/components/SectionTitle";
import { copy } from "@/lib/copy";
import { getLatestAdvice } from "@/lib/data";
import { formatDateLong, formatDayMonth, formatEuro } from "@/lib/format";
import { parseResultQuery, type RawSearchParams } from "@/lib/params";
import { periodInfo, periodLabel } from "@/lib/periods";
import { destinationPhotos } from "@/lib/photos";

type ResultViewProps = {
  searchParams: Promise<RawSearchParams>;
};

const card = "reveal rounded-[32px] bg-surface p-8 md:p-12";

/** Contenu de /resultat : lit les paramètres d'URL puis la dernière ligne `advice`. */
export default async function ResultView({ searchParams }: ResultViewProps) {
  const query = parseResultQuery(await searchParams);
  const { origin, destination, period, adults, children, bags, passengers } = query;

  if (!origin || !destination || !period) {
    return <ResultMessage title={copy.result.invalidTitle} text={copy.result.invalidText} />;
  }

  const routeLabel = `${copy.places[origin]} ${copy.result.routeArrow} ${copy.places[destination]}`;
  const travellersLabel = [copy.result.adults(adults), copy.result.children(children)]
    .filter(Boolean)
    .join(" et ");

  // Lien partageable de cette page (paramètres normalisés).
  const qs = new URLSearchParams({
    from: origin,
    to: destination,
    period,
    adults: String(adults),
    children: String(children),
    bags: String(bags),
  });
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const pageUrl = `${proto}://${host}/resultat?${qs.toString()}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(
    copy.result.whatsappText(`${routeLabel} (${periodLabel(period)})`, pageUrl),
  )}`;

  const summary = (
    <section
      aria-labelledby="resume-title"
      className="reveal grid grid-cols-1 gap-8 rounded-[32px] bg-surface p-8 md:grid-cols-[1fr_minmax(0,0.8fr)] md:items-center md:p-12"
    >
      <div className="flex flex-col gap-6">
        <Eyebrow>{copy.result.eyebrow}</Eyebrow>
        <SectionTitle
          as="h1"
          id="resume-title"
          first={routeLabel}
          second={periodLabel(period)}
        />
        <dl className="flex flex-col gap-2 text-base text-ink-soft md:flex-row md:gap-8 md:text-lg">
          <div className="flex gap-2">
            <dt className="font-medium text-ink">{copy.result.summaryTravellers} :</dt>
            <dd>{travellersLabel}</dd>
          </div>
          <div>
            <dt className="sr-only">{copy.search.bags}</dt>
            <dd>{copy.result.summaryBags(bags)}</dd>
          </div>
        </dl>
        <div>
          <PillButton href="/#recherche" variant="secondary">
            {copy.result.backToSearch}
          </PillButton>
        </div>
      </div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-surface-muted">
        <Image
          src={destinationPhotos[destination].src}
          alt={destinationPhotos[destination].alt}
          fill
          priority
          sizes="(min-width: 768px) 480px, 100vw"
          className="object-cover"
        />
      </div>
    </section>
  );

  const disclaimer = (
    <p className="px-2 py-6 text-center text-lg text-ink-soft md:px-0">{copy.result.disclaimer}</p>
  );

  if (!passengers) {
    return (
      <>
        {summary}
        <ResultMessage
          title={copy.result.profileNotTrackedTitle}
          text={copy.result.profileNotTrackedText}
        />
        {disclaimer}
      </>
    );
  }

  const { data: advice } = await getLatestAdvice(origin, destination, period, passengers);

  if (!advice) {
    return (
      <>
        {summary}
        <ResultMessage title={copy.result.noAdviceTitle} text={copy.result.noAdviceText} />
        {disclaimer}
      </>
    );
  }

  const cheaper = advice.cheaper_option;

  return (
    <>
      {/* 1. Résumé du trajet */}
      {summary}

      {/* 2. Prix total famille + conseil */}
      <section aria-labelledby="prix-title" className={card}>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <Eyebrow>{copy.result.priceEyebrow}</Eyebrow>
            <h2 id="prix-title" className="sr-only">
              {copy.result.priceEyebrow}
            </h2>
            {advice.price_eur !== null ? (
              <>
                <p className="text-6xl font-normal leading-none tracking-tight text-accent md:text-8xl">
                  {formatEuro(advice.price_eur)}
                </p>
                <p className="text-lg text-ink-soft">
                  {copy.result.priceFor(copy.passengers[advice.passengers])}
                </p>
                <p className="text-sm text-ink-soft">{copy.result.priceNote}</p>
              </>
            ) : (
              <p className="text-lg text-ink-soft">{copy.result.priceMissing}</p>
            )}
          </div>
          <div className="flex flex-col items-start gap-4">
            <p className="text-sm font-medium text-ink">
              {copy.result.adviceLabel}
            </p>
            <AdviceBadge status={advice.status} />
            <p className="text-base text-ink md:text-lg">{advice.reason}</p>
            <p className="text-sm text-ink-soft">
              {copy.result.updatedOn(formatDateLong(advice.computed_at))}
            </p>
          </div>
        </div>
      </section>

      {/* Lien partenaire Aviasales (prix exact) */}
      <AffiliateCta advice={advice} adults={adults} childCount={children} />

      {/* 3. Option moins chère */}
      <section aria-labelledby="option-title" className={card}>
        <div className="flex flex-col gap-4">
          <Eyebrow>{copy.result.cheaperEyebrow}</Eyebrow>
          {cheaper ? (
            <>
              <h2
                id="option-title"
                className="text-3xl font-medium leading-[1.05] tracking-tight text-ink md:text-4xl"
              >
                {cheaper.kind === "airport"
                  ? copy.result.cheaperAirport(
                      copy.places[cheaper.origin] ?? cheaper.origin,
                      formatDayMonth(cheaper.departure_date),
                    )
                  : cheaper.kind === "stops"
                    ? copy.result.cheaperStops(formatDayMonth(cheaper.departure_date))
                    : copy.result.cheaperDay(formatDayMonth(cheaper.departure_date))}
              </h2>
              {cheaper.kind === "stops" && (
                <p className="text-lg text-ink-soft">{copy.result.cheaperStopsNote}</p>
              )}
              {cheaper.kind === "airport" && cheaper.destination !== destination && (
                <p className="text-lg text-ink-soft">
                  {copy.result.cheaperAirportTo(
                    copy.places[cheaper.destination] ?? cheaper.destination,
                  )}
                </p>
              )}
              <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="text-4xl font-normal tracking-tight text-accent md:text-5xl">
                  {formatEuro(cheaper.price_eur)}
                </span>
                <span className="text-lg text-ink-soft">
                  {copy.result.cheaperSaving(formatEuro(cheaper.saving_eur))}
                </span>
              </p>
            </>
          ) : (
            <h2 id="option-title" className="text-lg text-ink-soft">
              {copy.result.cheaperNone}
            </h2>
          )}
        </div>
      </section>

      {/* 4. Calendrier des prix */}
      <section aria-labelledby="calendrier-title" className={card}>
        <div className="mb-10 flex flex-col gap-6">
          <Eyebrow>{copy.result.calendarEyebrow}</Eyebrow>
          <SectionTitle
            id="calendrier-title"
            first={copy.result.calendarTitleFirst}
            second={copy.result.calendarTitleSecond}
          />
        </div>
        {periodInfo(period)?.kind === "month" ? (
          <MonthCalendar month={period.slice("mois-".length)} days={advice.calendar ?? []} />
        ) : (
          <PriceCalendar days={advice.calendar ?? []} />
        )}
      </section>

      {/* 5. Partage et alerte */}
      <section aria-labelledby="partage-title" className={card}>
        <div className="flex flex-col gap-6">
          <Eyebrow>{copy.result.shareEyebrow}</Eyebrow>
          <h2 id="partage-title" className="sr-only">
            {copy.result.shareEyebrow}
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <PillButton href={whatsappHref} external>
              {copy.result.shareWhatsapp}
            </PillButton>
            <PillButton variant="secondary" disabled>
              {copy.result.alertMe}
            </PillButton>
          </div>
          <p className="flex items-center gap-2 text-sm text-ink-soft">
            <MessageCircle aria-hidden="true" className="size-4 text-accent" />
            {copy.result.alertSoon}
          </p>
        </div>
      </section>

      {/* 6. Mention */}
      {disclaimer}
    </>
  );
}
