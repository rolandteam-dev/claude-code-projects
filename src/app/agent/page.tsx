import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { AgentConsole } from "@/components/agent/AgentConsole";
import { site } from "@/lib/site";

// Internal tool — never indexed, and also disallowed in robots.ts.
export const metadata: Metadata = {
  title: "Agent Console",
  description: "Internal console for the Roland Luxury team.",
  robots: { index: false, follow: false, nocache: true },
};

export default function AgentPage() {
  return (
    <Container size="wide" className="py-14">
      <div className="mb-10">
        <div className="eyebrow">Internal · {site.parentBrand}</div>
        <h1 className="mt-2 font-serif text-[2.6rem] leading-none text-[var(--color-ink)]">Agent console</h1>
        <p className="mt-3 max-w-[64ch] font-sans text-[0.95rem] text-[var(--color-ink-soft)]">
          Who&apos;s active in the client portal, who&apos;s gone quiet, and one-click hub links to send. Everything here
          reads from Follow Up Boss — the CRM stays the source of truth.
        </p>
      </div>
      <AgentConsole />
    </Container>
  );
}
