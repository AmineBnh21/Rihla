import Link from "next/link";
import { Plane } from "lucide-react";
import { copy } from "@/lib/copy";

/** Logo Diaspora Routes (icône avion dans un cercle bordeaux + nom). */
export default function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      aria-label={copy.nav.logoLabel}
      className="flex items-center gap-2 rounded-full text-base font-semibold tracking-tight text-ink"
    >
      <span
        aria-hidden="true"
        className="flex size-9 items-center justify-center rounded-full bg-primary"
      >
        <Plane className="size-4 -rotate-45 text-surface" />
      </span>
      {copy.site.name}
    </Link>
  );
}
