import type { Metadata } from "next";
import ContentPage from "@/components/ContentPage";
import { copy } from "@/lib/copy";
import { readContent } from "@/lib/content";

export const metadata: Metadata = { title: copy.pages.legal.metaTitle };

export default async function LegalPage() {
  const source = await readContent("mentions-legales");
  return (
    <ContentPage
      eyebrow={copy.pages.legal.eyebrow}
      subtitle={copy.pages.legal.subtitle}
      source={source}
    />
  );
}
