import type { Metadata } from "next";
import Image from "next/image";
import Eyebrow from "@/components/Eyebrow";
import SectionTitle from "@/components/SectionTitle";
import { copy } from "@/lib/copy";
import { photos } from "@/lib/photos";

export const metadata: Metadata = { title: copy.pages.credits.metaTitle };

const linkClass = "font-medium text-primary underline underline-offset-4 hover:text-primary-dark";

export default function CreditsPage() {
  return (
    <>
      <section aria-labelledby="page-title" className="rounded-[32px] bg-surface p-8 md:p-12">
        <div className="flex flex-col gap-6">
          <Eyebrow>{copy.pages.credits.eyebrow}</Eyebrow>
          <SectionTitle
            as="h1"
            id="page-title"
            first={copy.pages.credits.titleFirst}
            second={copy.pages.credits.titleSecond}
          />
          <p className="max-w-2xl text-base text-ink-soft md:text-lg">{copy.pages.credits.intro}</p>
        </div>
      </section>
      <section aria-label={copy.pages.credits.listLabel} className="rounded-[32px] bg-surface p-8 md:p-12">
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.values(photos).map((p) => (
            <li key={p.src} className="reveal flex flex-col gap-4 rounded-3xl bg-surface-muted p-4">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                <Image src={p.src} alt={p.alt} fill sizes="(min-width: 1024px) 360px, 100vw" className="object-cover" />
              </div>
              <div className="flex flex-col gap-1 px-2 pb-2 text-base text-ink-soft">
                <p className="font-medium text-ink">{p.title}</p>
                <p>
                  {copy.pages.credits.by} {p.author} ·{" "}
                  <a href={p.licenseUrl} className={linkClass} target="_blank" rel="noopener noreferrer">
                    {p.license}
                  </a>
                </p>
                <a href={p.page} className={linkClass} target="_blank" rel="noopener noreferrer">
                  {copy.pages.credits.source}
                </a>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
