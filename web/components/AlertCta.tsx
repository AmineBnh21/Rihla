import Eyebrow from "@/components/Eyebrow";
import PillButton from "@/components/PillButton";
import SectionTitle from "@/components/SectionTitle";
import { copy } from "@/lib/copy";

/**
 * Carte bordeaux d'appel à l'action pour les alertes e-mail.
 * Désactivée tant que l'étape 8 (alertes) n'est pas faite.
 */
export default function AlertCta() {
  return (
    <section
      id="alerte"
      aria-labelledby="alerte-title"
      className="reveal rounded-[32px] bg-primary p-8 md:p-12"
    >
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-end">
        <div className="flex flex-col gap-6">
          <Eyebrow tone="light">{copy.alert.eyebrow}</Eyebrow>
          <SectionTitle
            id="alerte-title"
            tone="light"
            first={copy.alert.titleFirst}
            second={copy.alert.titleSecond}
          />
          <p className="text-base text-surface/90 md:text-lg">{copy.alert.text}</p>
        </div>

        <form className="flex flex-col gap-3" aria-describedby="alerte-soon">
          <label htmlFor="alert-email" className="text-sm font-medium text-surface">
            {copy.alert.emailLabel}
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="alert-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder={copy.alert.emailPlaceholder}
              disabled
              className="min-h-12 w-full rounded-full border border-surface/40 bg-surface px-5 text-base text-ink placeholder:text-ink-soft disabled:cursor-not-allowed disabled:opacity-80"
            />
            <PillButton type="submit" variant="secondary" disabled>
              {copy.alert.submit}
            </PillButton>
          </div>
          <p id="alerte-soon" className="text-sm text-surface/90">
            {copy.alert.soon}
          </p>
        </form>
      </div>
    </section>
  );
}
