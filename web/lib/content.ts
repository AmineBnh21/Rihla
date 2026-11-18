import { readFile } from "node:fs/promises";
import path from "node:path";
import { cacheLife } from "next/cache";

/** Textes éditoriaux en Markdown, dans web/content/. Lus et mis en cache au build (pages statiques). */
export type ContentName = "methode" | "mentions-legales" | "confidentialite";

export async function readContent(name: ContentName): Promise<string> {
  "use cache";
  cacheLife("max");
  return readFile(path.join(process.cwd(), "content", `${name}.md`), "utf-8");
}
