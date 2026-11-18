import type { Metadata } from "next";
import ContentPage from "@/components/ContentPage";
import { copy } from "@/lib/copy";
import { readContent } from "@/lib/content";

export const metadata: Metadata = { title: copy.pages.privacy.metaTitle };

export default async function PrivacyPage() {
  const source = await readContent("confidentialite");
  return (
    <ContentPage
      eyebrow={copy.pages.privacy.eyebrow}
      subtitle={copy.pages.privacy.subtitle}
      source={source}
    />
  );
}
