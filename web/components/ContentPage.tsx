import Image from "next/image";
import Eyebrow from "@/components/Eyebrow";
import Markdown, { splitTitle } from "@/components/Markdown";
import SectionTitle from "@/components/SectionTitle";
import type { Photo } from "@/lib/photos";

type ContentPageProps = {
  eyebrow: string;
  /** 2e ligne du titre (la 1re vient du `# titre` du fichier Markdown). */
  subtitle: string;
  source: string;
  /** Bandeau photo sous le titre. */
  photo?: Photo;
};

/** Page de texte : en-tête sur deux tons + contenu Markdown dans une grande carte. */
export default function ContentPage({ eyebrow, subtitle, source, photo }: ContentPageProps) {
  const { title, body } = splitTitle(source);
  return (
    <>
      <section
        aria-labelledby="page-title"
        className="flex flex-col gap-8 rounded-[32px] bg-surface p-8 md:p-12"
      >
        <div className="flex flex-col gap-6">
          <Eyebrow>{eyebrow}</Eyebrow>
          <SectionTitle as="h1" id="page-title" first={title ?? eyebrow} second={subtitle} />
        </div>
        {photo && (
          <div className="relative aspect-[16/9] overflow-hidden rounded-3xl bg-surface-muted md:aspect-[21/8]">
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              priority
              sizes="(min-width: 1200px) 1100px, 100vw"
              className="object-cover"
            />
          </div>
        )}
      </section>
      <article className="reveal rounded-[32px] bg-surface p-8 md:p-12">
        <div className="max-w-3xl">
          <Markdown source={body} />
        </div>
      </article>
    </>
  );
}
