/**
 * Minimal, safe inline-markdown renderer for editorial body text.
 * Supports **bold** and [label](href) links — internal links (starting with
 * "/") use next/link for fast client navigation and prefetch, which also
 * strengthens the site's internal-link graph for SEO. Everything else renders
 * as plain text; no raw HTML is ever injected.
 */
import Link from "next/link";
import type { ReactNode } from "react";

function renderInline(text: string, keyBase: string): ReactNode[] {
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
  const nodes: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index).replace(/\*\*/g, ""));
    if (m[1] !== undefined && m[2] !== undefined) {
      const href = m[2].trim();
      const internal = href.startsWith("/");
      nodes.push(
        internal ? (
          <Link key={`${keyBase}-l-${i}`} href={href} className="link-gold font-medium">
            {m[1]}
          </Link>
        ) : (
          <a key={`${keyBase}-l-${i}`} href={href} target="_blank" rel="noreferrer" className="link-gold font-medium">
            {m[1]}
          </a>
        ),
      );
    } else if (m[3] !== undefined) {
      nodes.push(<strong key={`${keyBase}-b-${i}`}>{m[3]}</strong>);
    }
    last = re.lastIndex;
    i++;
  }
  if (last < text.length) nodes.push(text.slice(last).replace(/\*\*/g, ""));
  return nodes;
}

/** Render a single paragraph of body text with inline bold + links. */
export function ProseText({ text }: { text: string }) {
  return <>{renderInline(text, "p")}</>;
}
