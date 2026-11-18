import Image from "next/image";
import { CalendarDays, School, TrendingUp, Users } from "lucide-react";
import AirlineList from "@/components/AirlineList";
import AlertCta from "@/components/AlertCta";
import BentoGrid from "@/components/BentoGrid";
import Eyebrow from "@/components/Eyebrow";
import Hero, { type HeroStat } from "@/components/Hero";
import LogoMarquee from "@/components/LogoMarquee";
import SearchForm from "@/components/SearchForm";
import SectionTitle from "@/components/SectionTitle";
import StatCard from "@/components/StatCard";
import StepList from "@/components/StepList";
import { copy } from "@/lib/copy";
import { getOverview, type Overview } from "@/lib/data";
import { formatDateLong, formatEuro } from "@/lib/format";
import { photos } from "@/lib/photos";

type Stat = { key: string; value: string; subtitle: string; text: string };

/** Chiffres de la section « Les chiffres » : une carte seulement si la donnée existe. */
function buildStats(o: Overview): Stat[] {
  const stats: Stat[] = [];
  if (o.routesCount !== null) {
    stats.push({
      key: "routes",
      value: String(o.routesCount),
      subtitle: copy.stats.routes.subtitle,
      text: copy.stats.routes.text,
    });
  }
  if (o.daysToEidFitr !== null) {
    stats.push({
      key: "days",
      value: copy.stats.daysToEid.value(o.daysToEidFitr),
      subtitle: copy.stats.daysToEid.subtitle,
      text: copy.stats.daysToEid.text,
    });
  }
  if (o.cheapestFitrSolo !== null) {
    const c = o.cheapestFitrSolo;
    stats.push({
      key: "cheapest",
      value: formatEuro(c.price),
      subtitle: copy.stats.cheapest.subtitle(
        `${copy.places[c.origin]} → ${copy.places[c.destination]}`,
      ),
      text: copy.stats.cheapest.text,
    });
  }
  if (o.maxObservations !== null) {
    stats.push({
      key: "obs",
      value: String(o.maxObservations),
      subtitle: copy.stats.observations.subtitle,
      text: copy.stats.observations.text,
    });
  }
  return stats;
}

function buildHeroStats(o: Overview): HeroStat[] {
  const stats: HeroStat[] = [];
  if (o.routesCount !== null) {
    stats.push({ value: String(o.routesCount), label: copy.hero.statRoutes });
  }
  if (o.profilesCount !== null) {
    stats.push({ value: String(o.profilesCount), label: copy.hero.statProfiles });
  }
  if (o.daysToEidFitr !== null) {
    stats.push({
      value: copy.hero.statDaysToEid(o.daysToEidFitr),
      label: copy.hero.statDaysToEidLabel,
    });
  }
  return stats;
}

export default async function HomePage() {
  const { data: overview } = await getOverview();
  const stats = buildStats(overview);

  return (
    <>
      {/* 1. Hero */}
      <Hero stats={buildHeroStats(overview)} />

      {/* Compagnies comparées (identification, pas partenariat) */}
      <LogoMarquee />

      {/* 2. Formulaire de recherche */}
      <section
        id="recherche"
        aria-labelledby="recherche-title"
        className="reveal rounded-[32px] bg-surface p-8 md:p-12"
      >
        <div className="mb-10 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-end">
          <div className="flex flex-col gap-6">
            <Eyebrow>{copy.search.eyebrow}</Eyebrow>
            <SectionTitle
              id="recherche-title"
              first={copy.search.titleFirst}
              second={copy.search.titleSecond}
            />
            <p className="max-w-md text-base text-ink-soft md:text-lg">{copy.search.lead}</p>
          </div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-surface-muted">
            <Image
              src={photos.alger.src}
              alt={photos.alger.alt}
              fill
              sizes="(min-width: 1024px) 560px, 100vw"
              className="object-cover object-[50%_35%]"
            />
          </div>
        </div>
        <SearchForm />
      </section>

      {/* 3. Le problème */}
      <section
        aria-labelledby="probleme-title"
        className="reveal rounded-[32px] bg-surface p-8 md:p-12"
      >
        <div className="mb-10 flex flex-col gap-6">
          <Eyebrow>{copy.problem.eyebrow}</Eyebrow>
          <SectionTitle
            id="probleme-title"
            first={copy.problem.titleFirst}
            second={copy.problem.titleSecond}
          />
        </div>
        <BentoGrid
          intro={{ title: copy.problem.introTitle, text: copy.problem.introText }}
          items={[
            { icon: CalendarDays, ...copy.problem.items.moving },
            { icon: School, ...copy.problem.items.school },
            { icon: Users, ...copy.problem.items.family },
            { icon: TrendingUp, ...copy.problem.items.competition },
          ]}
          cta={{
            title: copy.problem.ctaTitle,
            text: copy.problem.ctaText,
            href: "#recherche",
            label: copy.problem.ctaButton,
          }}
        />
      </section>

      {/* 4. Les chiffres (uniquement à partir des données) */}
      <section aria-labelledby="chiffres-title" className="reveal py-16 md:py-24">
        <div className="mb-10 flex flex-col gap-6 px-2 md:px-0">
          <Eyebrow>{copy.stats.eyebrow}</Eyebrow>
          <SectionTitle
            id="chiffres-title"
            first={copy.stats.titleFirst}
            second={copy.stats.titleSecond}
          />
        </div>
        {stats.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {stats.map((s) => (
                <StatCard key={s.key} value={s.value} subtitle={s.subtitle} text={s.text} />
              ))}
            </div>
            {overview.computedAt && (
              <p className="mt-6 px-2 text-lg text-ink-soft md:px-0">
                {copy.stats.updatedOn(formatDateLong(overview.computedAt))}
              </p>
            )}
          </>
        ) : (
          <p className="px-2 text-lg text-ink-soft md:px-0">{copy.stats.empty}</p>
        )}
      </section>

      {/* Les compagnies sur ces lignes (texte, sans logo) */}
      <AirlineList />

      {/* 5. Comment ça marche */}
      <section
        aria-labelledby="etapes-title"
        className="reveal rounded-[32px] bg-surface p-8 md:p-12"
      >
        <div className="mb-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_minmax(0,0.6fr)] lg:items-center">
          <div className="flex flex-col gap-6">
            <Eyebrow>{copy.steps.eyebrow}</Eyebrow>
            <SectionTitle
              id="etapes-title"
              first={copy.steps.titleFirst}
              second={copy.steps.titleSecond}
            />
            <p className="max-w-md text-base text-ink-soft md:text-lg">{copy.steps.lead}</p>
          </div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-surface-muted lg:aspect-[4/3]">
            <Image
              src={photos.window.src}
              alt={photos.window.alt}
              fill
              sizes="(min-width: 1024px) 420px, 100vw"
              className="object-cover object-[50%_45%]"
            />
          </div>
        </div>
        <StepList steps={copy.steps.items} />
      </section>

      {/* 6. Alerte e-mail */}
      <AlertCta />

      {/* 7. Footer : dans le layout */}
    </>
  );
}
