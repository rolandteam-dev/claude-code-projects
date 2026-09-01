import type { Metadata } from "next";
import { portalRoster, type RosterClient } from "@/lib/portal/roster";
import { PortalInviteBuilder } from "@/components/portal/PortalInviteBuilder";
import { AdminLogin } from "@/components/AdminLogin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Portal Clients — The Roland Team",
  robots: { index: false, follow: false },
};

/**
 * Internal companion to Seller Radar: who's active in the Client Portal, who's
 * gone quiet, and hub links to send. Same access convention as /admin/sellers —
 * ADMIN_TOKEN compared server-side, so no client data is served without it.
 */

/** Portal activity posts to FUB under these tags; this is what to do about each. */
const SIGNALS: { tag: string; means: string; action: string }[] = [
  {
    tag: "Portal: saved-home",
    means: "They saved a specific address. The event message carries it.",
    action: "Send comps on that home within the day — the highest-intent signal in the portal.",
  },
  {
    tag: "Portal: tour-request",
    means: "They asked for a showing from their saved list.",
    action: "Call, don't text. Book it before the weekend fills.",
  },
  {
    tag: "Portal: stage-complete",
    means: "They finished a whole stage — pre-approval done, inspection done, and so on.",
    action: "Congratulate them and set up the next stage. A natural, non-salesy touchpoint.",
  },
  {
    tag: "Portal: budget",
    means: "They ran their own numbers. Often means the price conversation is live.",
    action: "Offer to walk the numbers together, or loop the lender in.",
  },
  {
    tag: "Portal: vendor-intro",
    means: "They want an introduction — lender, inspector, title, movers.",
    action: "Make the intro personally, same day. Reply-all so they see you did it.",
  },
  {
    tag: "Portal: message",
    means: "They asked a question in the hub. The full text is in the event.",
    action: "Answer it directly. Unanswered portal questions are how clients drift.",
  },
];

function quietLabel(days: number | null): string {
  if (days === null) return "—";
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default async function PortalClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;
  const expected = process.env.ADMIN_TOKEN;

  if (!expected) {
    return (
      <div className="mx-auto max-w-[560px] px-6 py-20 text-center">
        <h1 className="font-serif text-[1.6rem] text-[var(--color-ink)]">Portal Clients is locked</h1>
        <p className="mt-3 font-sans text-[0.95rem] text-[var(--color-ink-soft)]">
          Set an <code>ADMIN_TOKEN</code> environment variable in Vercel to enable this internal dashboard, then
          open it with <code>?key=YOUR_TOKEN</code>.
        </p>
      </div>
    );
  }

  if (key !== expected) {
    return <AdminLogin title="Portal Clients" submitLabel="Open Portal Clients" />;
  }

  const roster = await portalRoster();
  const clients: RosterClient[] = roster.ok ? roster.clients : [];
  // Quietest first — this dashboard exists to surface who needs a nudge.
  const rows = [...clients].sort((a, b) => (b.quietDays ?? -1) - (a.quietDays ?? -1));
  const quiet = rows.filter((c) => (c.quietDays ?? 0) >= 7).length;
  const buyers = rows.filter((c) => c.journey === "buy").length;
  const sellers = rows.filter((c) => c.journey === "sell").length;

  const th = "px-3 py-2 text-left font-sans text-[0.66rem] uppercase tracking-[0.08em] text-[var(--color-muted)]";
  const td = "px-3 py-3 font-sans text-[0.88rem] text-[var(--color-ink)] align-top";

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-10">
      <div className="font-sans text-[0.7rem] uppercase tracking-[0.18em] text-[var(--color-gold)]">
        The Roland Team · Internal
      </div>
      <h1 className="mt-1 font-serif text-[2rem] text-[var(--color-ink)]">Portal Clients</h1>
      <p className="mt-1 max-w-[70ch] font-sans text-[0.9rem] text-[var(--color-ink-soft)]">
        Who&apos;s using their Client Portal and who&apos;s gone quiet. Every row is read live from Follow Up Boss —
        the CRM stays the source of truth, and all portal activity lands on the client&apos;s record there.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Portal clients", value: rows.length.toLocaleString() },
          { label: "Quiet 7+ days", value: quiet.toLocaleString() },
          { label: "Buyers", value: buyers.toLocaleString() },
          { label: "Sellers", value: sellers.toLocaleString() },
        ].map((t) => (
          <div key={t.label} className="rounded-[12px] border border-[var(--color-line)] bg-white p-4">
            <div className="font-sans text-[0.62rem] uppercase tracking-[0.1em] text-[var(--color-muted)]">
              {t.label}
            </div>
            <div className="mt-1 font-serif text-[1.5rem] text-[var(--color-ink)]">{t.value}</div>
          </div>
        ))}
      </div>

      {!roster.ok && (
        <p className="mt-6 rounded-[12px] border border-[var(--color-line)] bg-[var(--color-sand)] p-4 font-sans text-[0.88rem] text-[var(--color-ink-soft)]">
          {roster.error} The portal itself is unaffected — client activity is queued to the CRM independently.
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-[12px] border border-[var(--color-line)] bg-white">
        <table className="w-full min-w-[760px] border-collapse">
          <thead className="border-b border-[var(--color-line)] bg-[var(--color-sand)]">
            <tr>
              <th className={th}>Client</th>
              <th className={th}>Journey</th>
              <th className={th}>Stage</th>
              <th className={th}>Last activity</th>
              <th className={th}>Assigned</th>
              <th className={th}>Contact</th>
              <th className={th}>FUB</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className={td} colSpan={7}>
                  {roster.ok && !roster.configured ? (
                    <>
                      Follow Up Boss isn&apos;t connected yet. Add <code>FUB_API_KEY</code> in Vercel and this fills in
                      automatically — portal clients are tagged <strong>Client Portal</strong> in FUB.
                    </>
                  ) : (
                    <>
                      No portal clients yet. Send one their hub link with the builder below; they appear here as soon
                      as they set it up.
                    </>
                  )}
                </td>
              </tr>
            )}
            {rows.map((c) => (
              <tr key={`${c.id ?? c.email}-${c.name}`} className="border-b border-[var(--color-line)] last:border-0">
                <td className={td}>{c.name}</td>
                <td className={td}>
                  {c.journey === "unknown" ? "—" : c.journey === "sell" ? "Seller" : "Buyer"}
                </td>
                <td className={td}>{c.stage || "—"}</td>
                <td className={td}>
                  <span style={(c.quietDays ?? 0) >= 14 ? { color: "#b4433a", fontWeight: 600 } : undefined}>
                    {quietLabel(c.quietDays)}
                  </span>
                </td>
                <td className={td}>{c.assignedTo || "—"}</td>
                <td className={td}>
                  <div className="text-[0.8rem]">
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="text-[var(--color-gold)] no-underline">
                        {c.email}
                      </a>
                    )}
                    {c.phone && <div className="text-[var(--color-ink-soft)]">{c.phone}</div>}
                  </div>
                </td>
                <td className={td}>
                  {c.fubUrl && (
                    <a href={c.fubUrl} target="_blank" rel="noreferrer" className="text-[var(--color-gold)] no-underline">
                      Open →
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-12 font-serif text-[1.5rem] text-[var(--color-ink)]">Send a client their hub</h2>
      <p className="mb-4 mt-1 font-sans text-[0.88rem] text-[var(--color-ink-soft)]">
        No login for them to manage — the link opens their hub with everything pre-filled.
      </p>
      <PortalInviteBuilder />

      <h2 className="mt-12 font-serif text-[1.5rem] text-[var(--color-ink)]">Signal playbook</h2>
      <p className="mb-4 mt-1 max-w-[70ch] font-sans text-[0.88rem] text-[var(--color-ink-soft)]">
        Portal activity posts to Follow Up Boss as tagged events on the client&apos;s record, so nobody has to check a
        second system. Build smart lists off these tags.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {SIGNALS.map((s) => (
          <div key={s.tag} className="rounded-[12px] border border-[var(--color-line)] bg-white p-5">
            <code className="font-sans text-[0.78rem] font-semibold text-[var(--color-gold)]">{s.tag}</code>
            <p className="mt-2 font-sans text-[0.88rem] text-[var(--color-ink-soft)]">{s.means}</p>
            <p className="mt-2 font-sans text-[0.88rem] font-semibold text-[var(--color-ink)]">{s.action}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
