const fieldClass =
  "min-h-12 w-full rounded-2xl border border-ink/15 bg-surface-muted px-4 text-base text-ink";
const labelClass = "text-sm font-medium text-ink";

type SelectFieldProps = {
  id: string;
  label: string;
  defaultValue: string;
  options?: { value: string; label: string }[];
  /** Options regroupées (<optgroup>), à la place de `options`. */
  groups?: { label: string; options: { value: string; label: string }[] }[];
};

/** Liste déroulante avec son label. */
export default function SelectField({ id, label, defaultValue, options = [], groups }: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <select id={id} name={id} defaultValue={defaultValue} className={fieldClass}>
        {groups
          ? groups.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </optgroup>
            ))
          : options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
      </select>
    </div>
  );
}
