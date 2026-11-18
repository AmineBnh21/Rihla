import Form from "next/form";
import PillButton from "@/components/PillButton";
import SelectField from "@/components/SelectField";
import { copy } from "@/lib/copy";
import { DEFAULT_PERIOD, PERIOD_GROUPS } from "@/lib/periods";
import { DESTINATIONS, ORIGINS } from "@/lib/types";

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

type SearchFormProps = {
  defaults?: {
    from?: string;
    to?: string;
    period?: string;
    adults?: number;
    children?: number;
    bags?: number;
  };
};

const numbers = (from: number, to: number) =>
  range(from, to).map((n) => ({ value: String(n), label: String(n) }));

/** Formulaire de recherche ; soumission GET vers /resultat (lien partageable). */
export default function SearchForm({ defaults = {} }: SearchFormProps) {
  return (
    <Form action="/resultat" className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SelectField
          id="from"
          label={copy.search.from}
          defaultValue={defaults.from ?? ORIGINS[0]}
          options={ORIGINS.map((c) => ({ value: c, label: copy.places[c] }))}
        />
        <SelectField
          id="to"
          label={copy.search.to}
          defaultValue={defaults.to ?? DESTINATIONS[0]}
          options={DESTINATIONS.map((c) => ({ value: c, label: copy.places[c] }))}
        />
        <SelectField
          id="period"
          label={copy.search.period}
          defaultValue={defaults.period ?? DEFAULT_PERIOD}
          groups={PERIOD_GROUPS.map((g) => ({
            label: g.label,
            options: g.periods.map((p) => ({ value: p.id, label: p.label })),
          }))}
        />
      </div>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 text-sm font-medium uppercase tracking-wide text-ink">
          {copy.search.travellers}
        </legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SelectField
            id="adults"
            label={copy.search.adults}
            defaultValue={String(defaults.adults ?? 2)}
            options={numbers(1, 4)}
          />
          <SelectField
            id="children"
            label={copy.search.children}
            defaultValue={String(defaults.children ?? 2)}
            options={numbers(0, 6)}
          />
          <SelectField
            id="bags"
            label={copy.search.bags}
            defaultValue={String(defaults.bags ?? 1)}
            options={numbers(0, 8)}
          />
        </div>
        <p className="text-sm text-ink-soft">{copy.search.profilesHint}</p>
      </fieldset>

      <div>
        <PillButton type="submit">{copy.search.submit}</PillButton>
      </div>
    </Form>
  );
}
