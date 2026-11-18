import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Rendu Markdown minimal, côté serveur, sans dépendance.
 * Gère ce qu'utilisent les textes de web/content/ : titres (##, ###),
 * paragraphes (retours à la ligne conservés), listes à puces sur deux niveaux,
 * tableaux simples, **gras**, `code` et [liens](url).
 * Les commentaires HTML (<!-- -->) sont retirés.
 */

type ListItem = { text: string; children: string[] };
type Block =
  | { type: "h2" | "h3" | "h4"; text: string }
  | { type: "p"; lines: string[] }
  | { type: "ul"; items: ListItem[] }
  | { type: "table"; head: string[]; rows: string[][] };

export function stripComments(source: string): string {
  return source.replace(/<!--[\s\S]*?-->/g, "");
}

/** Sépare le titre `# …` du reste du texte. */
export function splitTitle(source: string): { title: string | null; body: string } {
  const clean = stripComments(source);
  const match = clean.match(/^\s*#\s+(.+)$/m);
  if (!match) return { title: null, body: clean };
  return { title: match[1].trim(), body: clean.replace(match[0], "") };
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());
}

function parse(source: string): Block[] {
  const lines = stripComments(source).replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      i++;
      continue;
    }

    const heading = line.match(/^(#{2,4})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length as 2 | 3 | 4;
      blocks.push({ type: `h${level}`, text: heading[2].trim() });
      i++;
      continue;
    }

    if (line.trim().startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) tableLines.push(lines[i++]);
      const [head, , ...rows] = tableLines;
      blocks.push({ type: "table", head: splitRow(head), rows: rows.map(splitRow) });
      continue;
    }

    if (/^-\s+/.test(line)) {
      const items: ListItem[] = [];
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) {
        const nested = /^\s{2,}-\s+/.test(lines[i]);
        const text = lines[i].replace(/^\s*-\s+/, "");
        if (nested && items.length > 0) items[items.length - 1].children.push(text);
        else items.push({ text, children: [] });
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^#{2,4}\s/.test(lines[i]) &&
      !/^-\s+/.test(lines[i]) &&
      !lines[i].trim().startsWith("|")
    ) {
      para.push(lines[i].trim());
      i++;
    }
    blocks.push({ type: "p", lines: para });
  }
  return blocks;
}

const linkClass =
  "font-medium text-primary underline underline-offset-4 hover:text-primary-dark";

function inline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)|(\[À COMPLÉTER[^\]]*\])/g;
  let last = 0;
  let n = 0;
  for (const m of text.matchAll(pattern)) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const key = `${keyPrefix}-${n++}`;
    if (m[1] !== undefined) {
      nodes.push(
        <strong key={key} className="font-semibold text-ink">
          {inline(m[1], key)}
        </strong>,
      );
    } else if (m[2] !== undefined) {
      nodes.push(
        <code key={key} className="rounded-md bg-surface-muted px-1.5 py-0.5 text-[0.9em]">
          {m[2]}
        </code>,
      );
    } else if (m[3] !== undefined) {
      const href = m[4];
      nodes.push(
        href.startsWith("/") ? (
          <Link key={key} href={href} className={linkClass}>
            {m[3]}
          </Link>
        ) : (
          <a key={key} href={href} className={linkClass} target="_blank" rel="noopener noreferrer">
            {m[3]}
          </a>
        ),
      );
    } else if (m[5] !== undefined) {
      // Champ à compléter par l'auteur : bien visible tant qu'il n'est pas rempli.
      nodes.push(
        <mark key={key} className="rounded-md bg-accent/15 px-1 text-ink">
          {m[5]}
        </mark>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export default function Markdown({ source }: { source: string }) {
  const blocks = parse(source);
  return (
    <div className="flex flex-col gap-5 text-base text-ink-soft md:text-lg">
      {blocks.map((b, bi) => {
        const k = `b${bi}`;
        switch (b.type) {
          case "h2":
            return (
              <h2
                key={k}
                className="mt-8 text-3xl font-medium leading-[1.05] tracking-tight text-ink first:mt-0 md:text-4xl"
              >
                {inline(b.text, k)}
              </h2>
            );
          case "h3":
            return (
              <h3 key={k} className="mt-4 text-xl font-medium tracking-tight text-ink md:text-2xl">
                {inline(b.text, k)}
              </h3>
            );
          case "h4":
            return (
              <h4 key={k} className="mt-2 text-lg font-medium text-ink">
                {inline(b.text, k)}
              </h4>
            );
          case "p":
            return (
              <p key={k}>
                {b.lines.map((l, li) => (
                  <span key={`${k}-${li}`}>
                    {li > 0 && <br />}
                    {inline(l, `${k}-${li}`)}
                  </span>
                ))}
              </p>
            );
          case "ul":
            return (
              <ul key={k} className="flex list-disc flex-col gap-2 pl-6 marker:text-accent">
                {b.items.map((item, ii) => (
                  <li key={`${k}-${ii}`}>
                    {inline(item.text, `${k}-${ii}`)}
                    {item.children.length > 0 && (
                      <ul className="mt-2 flex list-[circle] flex-col gap-1 pl-6">
                        {item.children.map((c, ci) => (
                          <li key={`${k}-${ii}-${ci}`}>{inline(c, `${k}-${ii}-${ci}`)}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            );
          case "table":
            return (
              <div key={k} className="-mx-2 overflow-x-auto px-2">
                <table className="w-full min-w-[640px] border-collapse text-left text-base">
                  <thead>
                    <tr>
                      {b.head.map((h, hi) => (
                        <th
                          key={`${k}-h${hi}`}
                          scope="col"
                          className="border-b border-ink/15 py-3 pr-4 font-medium text-ink"
                        >
                          {inline(h, `${k}-h${hi}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, ri) => (
                      <tr key={`${k}-r${ri}`} className="align-top">
                        {r.map((c, ci) => (
                          <td key={`${k}-r${ri}-${ci}`} className="border-b border-ink/10 py-3 pr-4">
                            {inline(c, `${k}-r${ri}-${ci}`)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
        }
      })}
    </div>
  );
}
