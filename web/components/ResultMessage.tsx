import PillButton from "@/components/PillButton";
import { copy } from "@/lib/copy";

type ResultMessageProps = {
  title: string;
  text: string;
};

/** Carte de message (trajet non suivi, profil non suivi, pas encore de conseil). */
export default function ResultMessage({ title, text }: ResultMessageProps) {
  return (
    <section role="status" className="rounded-[32px] bg-surface p-8 md:p-12">
      <div className="flex max-w-2xl flex-col gap-4">
        <h2 className="text-3xl font-medium leading-[1.05] tracking-tight text-ink md:text-4xl">
          {title}
        </h2>
        <p className="text-base text-ink-soft md:text-lg">{text}</p>
        <div className="mt-2">
          <PillButton href="/#recherche" variant="secondary">
            {copy.result.backToSearch}
          </PillButton>
        </div>
      </div>
    </section>
  );
}
