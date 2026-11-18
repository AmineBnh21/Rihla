type StatCardProps = {
  value: string;
  subtitle: string;
  text: string;
};

/** Carte blanche : chiffre géant orange, sous-titre et phrase d'explication. */
export default function StatCard({ value, subtitle, text }: StatCardProps) {
  return (
    <article className="reveal flex h-full flex-col justify-between gap-10 rounded-[32px] bg-surface p-8">
      <div className="flex flex-col gap-2">
        <p className="text-6xl font-normal leading-none tracking-tight text-accent md:text-8xl">
          {value}
        </p>
        <h3 className="text-lg text-ink-soft">{subtitle}</h3>
      </div>
      <p className="text-base text-ink-soft">{text}</p>
    </article>
  );
}
