import Link from "next/link";
import Logo from "@/components/Logo";
import { copy } from "@/lib/copy";

const GITHUB_URL = "https://github.com/AmineBnh21/diaspora-routes";

const linkClass =
  "rounded-sm text-base text-ink-soft underline-offset-4 hover:text-ink hover:underline";

const columns = [
  {
    id: "footer-site",
    title: copy.footer.siteTitle,
    links: [
      { href: "/", label: copy.nav.home },
      { href: "/observatoire", label: copy.nav.observatory },
      { href: "/methode", label: copy.nav.method },
    ],
  },
  {
    id: "footer-legal",
    title: copy.footer.legalTitle,
    links: [
      { href: "/mentions-legales", label: copy.footer.legal },
      { href: "/confidentialite", label: copy.footer.privacy },
      { href: "/credits", label: copy.footer.credits },
    ],
  },
] as const;

/** Pied de page : colonnes de liens, mentions légales, confidentialité, GitHub. */
export default function Footer() {
  return (
    <footer className="rounded-[32px] bg-surface p-8 md:p-12">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
        <div className="flex flex-col gap-4">
          <Logo />
          <p className="text-base text-ink-soft">{copy.footer.tagline}</p>
        </div>

        {columns.map((col) => (
          <nav key={col.id} aria-labelledby={col.id} className="flex flex-col gap-3">
            <h2 id={col.id} className="text-sm font-medium text-ink">
              {col.title}
            </h2>
            <ul className="flex flex-col gap-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkClass}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-ink">
            {copy.footer.projectTitle}
          </h2>
          <a href={GITHUB_URL} className={linkClass} target="_blank" rel="noopener noreferrer">
            {copy.footer.github}
          </a>
        </div>
      </div>

      <div className="mt-12 flex flex-col gap-2 rounded-3xl bg-surface-muted px-6 py-4 text-sm text-ink-soft md:flex-row md:justify-between">
        <p>{copy.footer.copyright}</p>
        <p>{copy.footer.disclaimer}</p>
      </div>
    </footer>
  );
}
