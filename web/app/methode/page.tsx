import type { Metadata } from "next";
import ContentPage from "@/components/ContentPage";
import { copy } from "@/lib/copy";
import { readContent } from "@/lib/content";
import { photos } from "@/lib/photos";

export const metadata: Metadata = { title: copy.pages.method.metaTitle };

export default async function MethodPage() {
  const source = await readContent("methode");
  return (
    <ContentPage
      eyebrow={copy.pages.method.eyebrow}
      subtitle={copy.pages.method.subtitle}
      source={source}
      photo={photos.window}
    />
  );
}
