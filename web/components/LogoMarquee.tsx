import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import { AIRLINES, type Airline } from "@/lib/airlines";
import { copy } from "@/lib/copy";

/**
 * Bandeau défilant des compagnies comparées (identification, pas partenariat).
 * Logo officiel si le fichier existe dans public/images/airlines/<CODE>.svg ou .png,
 * sinon le nom de la compagnie en texte.
 * Défilement en CSS, en pause au survol et au focus, arrêté avec prefers-reduced-motion.
 */

const LOGO_DIR = path.join(process.cwd(), "public", "images", "airlines");

function logoFor(code: string): string | null {
  for (const ext of ["svg", "png"]) {
    if (existsSync(path.join(LOGO_DIR, `${code}.${ext}`))) return `/images/airlines/${code}.${ext}`;
  }
  return null;
}

function Item({ airline }: { airline: Airline }) {
  const logo = logoFor(airline.code);
  return (
    <span className="flex h-16 shrink-0 items-center px-8 md:px-12">
      {logo ? (
        // SVG servis tels quels (pas d'optimisation d'image pour les SVG), dans une boîte fixe
        // pour que les logos très larges (Air France) ne paraissent pas plus gros que les autres.
        <Image
          src={logo}
          alt={airline.name}
          width={176}
          height={48}
          unoptimized
          className="h-10 w-36 object-contain md:h-12 md:w-44"
        />
      ) : (
        <span className="whitespace-nowrap text-2xl font-medium tracking-tight text-ink-soft md:text-3xl">
          {airline.name}
        </span>
      )}
    </span>
  );
}

export default function LogoMarquee() {
  return (
    <section
      aria-labelledby="marquee-title"
      className="flex flex-col gap-6 overflow-hidden rounded-[32px] bg-surface py-8 md:py-10"
    >
      <h2 id="marquee-title" className="px-8 text-base font-medium text-ink md:px-12">
        {copy.airlines.marqueeTitle}
      </h2>

      {/* Liste lisible par les lecteurs d'écran ; le bandeau animé est décoratif. */}
      <ul className="sr-only">
        {AIRLINES.map((a) => (
          <li key={a.code}>{a.name}</li>
        ))}
      </ul>

      <div aria-hidden="true" className="marquee group relative flex overflow-hidden">
        {[0, 1].map((copyIndex) => (
          <div key={copyIndex} className="marquee-track flex shrink-0 items-center">
            {[...AIRLINES, ...AIRLINES].map((a, i) => (
              <Item key={`${copyIndex}-${a.code}-${i}`} airline={a} />
            ))}
          </div>
        ))}
      </div>

      <p className="px-8 text-sm text-ink-soft md:px-12">{copy.airlines.trademarks}</p>
    </section>
  );
}
