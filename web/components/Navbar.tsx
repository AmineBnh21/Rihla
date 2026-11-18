"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import Logo from "@/components/Logo";
import PillButton from "@/components/PillButton";
import { copy } from "@/lib/copy";

const links = [
  { href: "/", label: copy.nav.home },
  { href: "/observatoire", label: copy.nav.observatory },
  { href: "/methode", label: copy.nav.method },
] as const;

/** Barre de navigation en pilule flottante ; panneau plein écran sur mobile. */
export default function Navbar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className="sticky top-3 z-40">
      <nav
        aria-label={copy.nav.label}
        className="flex items-center justify-between gap-4 rounded-full bg-surface py-2 pl-3 pr-2 shadow-sm shadow-ink/5 md:pl-4"
      >
        <Logo />

        <ul className="hidden items-center gap-6 lg:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="rounded-full px-1 text-sm font-medium text-ink-soft transition-colors hover:text-ink motion-reduce:transition-none"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 lg:flex">
          <PillButton href="/#recherche" variant="secondary">
            {copy.nav.seePrices}
          </PillButton>
          <PillButton href="/#alerte">{copy.nav.alertMe}</PillButton>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="menu-mobile"
          className="flex size-11 items-center justify-center rounded-full bg-surface-muted text-ink lg:hidden"
        >
          <Menu aria-hidden="true" className="size-5" />
          <span className="sr-only">{copy.nav.openMenu}</span>
        </button>
      </nav>

      {open && (
        <div
          id="menu-mobile"
          role="dialog"
          aria-modal="true"
          aria-label={copy.nav.label}
          className="fixed inset-0 z-50 flex flex-col bg-cream p-4 lg:hidden"
        >
          <div className="flex items-center justify-between rounded-full bg-surface py-2 pl-3 pr-2">
            <Logo onClick={close} />
            <button
              type="button"
              onClick={close}
              autoFocus
              className="flex size-11 items-center justify-center rounded-full bg-surface-muted text-ink"
            >
              <X aria-hidden="true" className="size-5" />
              <span className="sr-only">{copy.nav.closeMenu}</span>
            </button>
          </div>
          <ul className="mt-10 flex flex-col gap-2 px-2">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={close}
                  className="block rounded-2xl py-3 text-4xl font-medium leading-[1.05] tracking-tight text-ink"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-auto flex flex-col gap-3 px-2 pb-4" onClick={close}>
            <PillButton href="/#recherche" variant="secondary" className="justify-between">
              {copy.nav.seePrices}
            </PillButton>
            <PillButton href="/#alerte" className="justify-between">
              {copy.nav.alertMe}
            </PillButton>
          </div>
        </div>
      )}
    </header>
  );
}
