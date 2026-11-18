import Eyebrow from "@/components/Eyebrow";
import SectionTitle from "@/components/SectionTitle";
import { AIRLINES } from "@/lib/airlines";
import { copy } from "@/lib/copy";

/**
 * Les compagnies qui volent sur nos lignes, en texte (pas de logo sans autorisation).
 * Ce ne sont pas des partenaires : on compare leurs prix, sans lien commercial.
 */
export default function AirlineList() {
  return (
    <section
      aria-labelledby="compagnies-title"
      className="reveal grid grid-cols-1 gap-10 rounded-[32px] bg-surface p-8 md:p-12 lg:grid-cols-[minmax(0,0.8fr)_1fr]"
    >
      <div className="flex flex-col gap-6">
        <Eyebrow>{copy.airlines.eyebrow}</Eyebrow>
        <SectionTitle
          id="compagnies-title"
          first={copy.airlines.titleFirst}
          second={copy.airlines.titleSecond}
        />
        <p className="max-w-md text-base text-ink-soft md:text-lg">{copy.airlines.text}</p>
        <p className="max-w-md text-base font-medium text-ink">{copy.airlines.independent}</p>
      </div>

      <ul className="flex flex-col gap-2">
        {AIRLINES.map((a) => (
          <li key={a.code} className="flex flex-col gap-1 rounded-3xl bg-surface-muted px-6 py-5">
            <p className="flex items-baseline justify-between gap-4">
              <span className="text-2xl font-medium tracking-tight text-ink md:text-3xl">
                {a.name}
              </span>
              <span className="text-sm text-ink-soft">
                <span className="sr-only">{copy.airlines.codeLabel} </span>
                {a.code}
              </span>
            </p>
            <p className="text-base text-ink-soft">{a.note}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
