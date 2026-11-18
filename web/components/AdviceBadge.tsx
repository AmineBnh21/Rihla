import { CircleCheck, Eye, Hourglass, type LucideIcon } from "lucide-react";
import { copy } from "@/lib/copy";
import type { Status } from "@/lib/types";

const styles: Record<Status, { icon: LucideIcon; ring: string; dot: string }> = {
  book: { icon: CircleCheck, ring: "border-status-book bg-status-book/10", dot: "bg-status-book" },
  watch: { icon: Eye, ring: "border-status-watch bg-status-watch/10", dot: "bg-status-watch" },
  wait: { icon: Hourglass, ring: "border-status-wait bg-status-wait/10", dot: "bg-status-wait" },
};

/**
 * Grande pastille de conseil. La couleur n'est jamais seule :
 * toujours une icône et un libellé texte.
 */
export default function AdviceBadge({ status }: { status: Status }) {
  const { icon: Icon, ring, dot } = styles[status];
  return (
    <p
      className={`inline-flex items-center gap-3 rounded-full border-2 py-2 pl-2 pr-6 ${ring}`}
    >
      <span
        aria-hidden="true"
        className={`flex size-11 shrink-0 items-center justify-center rounded-full ${dot}`}
      >
        <Icon className="size-6 text-surface" />
      </span>
      <span className="text-2xl font-medium tracking-tight text-ink">
        {copy.status[status].label}
      </span>
    </p>
  );
}
