import type { Metadata } from "next";
import { databaseClosings } from "@/lib/idx/closings";
import { loadFormerMatcher } from "@/lib/idx/referral";
import { dashboardUrl } from "@/lib/homeowners/brand";
import { AdminLogin } from "@/components/AdminLogin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Closings — The Roland Team",
  robots: { index: false, follow: false },
};

const money = (n: number) =>
  n > 0 ? n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }) : "—";

function fubLink(fubPersonId?: string): string | null {
  if (!fubPersonId) return null;
  const sub = (process.env.FUB_ACCOUNT_SUBDOMAIN || "therolandteam1").trim();
  return `https://${sub}.followupboss.com/2/people/view/${encodeURIComponent(fubPersonId)}`;
}

export default async function ClosingsPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string; days?: string }>;
}) {
  const { key, days } = await searchParams;
  const expected = process.env.ADMIN_TOKEN;

  if (!expected) {
    return (
      <div className="mx-auto max-w-[560px] px-6 py-20 text-center">
        <h1 className="font-serif text-[1.6rem] text-[var(--color-ink)]">Closings is locked</h1>
        <p className="mt-3 font-sans text-[0.95rem] text-[var(--color-ink-soft)]">
          Set an <code>ADMIN_TOKEN</code> in Vercel, then open with <code>?key=YOUR_TOKEN</code>.
        </p>
      </div>
    );
  }
  if (key !== expected) {
    return <AdminLogin title="Closings" submitLabel="Open Closings" />;
  }

  const sinceDays = Math.min(Math.max(Number(days) || 30, 1), 180);
  const result = await databaseClosings(sinceDays);
  const matchFormer = await loadFormerMatcher();

  const label = "font-sans text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]";
  const cell = "px-3 py-2.5 font-sans text-[0.82rem] text-[var(--color-ink)] align-top";

  return (
    <div className="mx-auto max-w-[1050px] px-6 py-12">
      <div className="font-sans text-[0.7rem] uppercase tracking-[0.18em] text-[var(--color-gold)]">
        The Roland Team · Internal
      </div>
      <h1 className="mt-1 font-serif text-[2rem] text-[var(--color-ink)]">Closings in your database</h1>
      <p className="mt-2 font-sans text-[0.9rem] text-[var(--color-ink-soft)]">
        Homes you have on file that have SOLD recently — with the listing agent, so you can spot a possible referral.
        Last {sinceDays} days.{" "}
        {[14, 30, 90].map((d) => (
          <a
            key={d}
            href={`?key=${encodeURIComponent(key)}&days=${d}`}
            className="ml-2 font-semibold text-[var(--color-gold)] underline-offset-2 hover:underline"
          >
            {d}d
          </a>
        ))}
      </p>

      {!result.ok ? (
        <div className="mt-8 rounded-[12px] border border-[var(--color-line)] bg-white p-5 font-sans text-[0.9rem] text-[var(--color-ink-soft)]">
          {result.reason === "not_configured"
            ? "REPLIERS_API_KEY isn't set, so the MLS feed can't be queried."
            : `Couldn't reach the MLS feed${result.detail ? `: ${result.detail}` : "."}`}
        </div>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap gap-5 rounded-[12px] border border-[var(--color-line)] bg-[var(--color-sand)] px-5 py-3">
            <div>
              <div className={label}>Sales scanned</div>
              <div className="font-serif text-[1.4rem] text-[var(--color-ink)]">{result.pulled.toLocaleString()}</div>
            </div>
            <div>
              <div className={label}>Contacts indexed</div>
              <div className="font-serif text-[1.4rem] text-[var(--color-ink)]">{result.indexed.toLocaleString()}</div>
            </div>
            <div>
              <div className={label}>Matched (your database)</div>
              <div className="font-serif text-[1.4rem] text-[var(--color-gold)]">{result.matched.length}</div>
            </div>
            <div>
              <div className={label}>⚠️ Former teammate</div>
              <div className="font-serif text-[1.4rem] text-[#b4433a]">
                {result.matched.filter((m) => matchFormer(m.listAgent)).length}
              </div>
            </div>
          </div>

          {result.moreToScan && (
            <p className="mt-3 font-sans text-[0.72rem] text-[var(--color-muted)]">
              High sales volume — only the most recent ~3,000 sales were scanned for this window. Use a shorter window
              (14d) for complete coverage, or check more often.
            </p>
          )}
          {result.pulled === 0 && (
            <p className="mt-3 font-sans text-[0.72rem] text-[var(--color-muted)]">
              Zero sold listings came back from the feed for this window — tell me and I&apos;ll check the query.
            </p>
          )}

          {result.matched.length === 0 ? (
            <div className="mt-6 rounded-[12px] border border-[var(--color-line)] bg-white p-5 font-sans text-[0.9rem] text-[var(--color-ink-soft)]">
              No homes in your database closed in this window.
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto rounded-[12px] border border-[var(--color-line)] bg-white">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-line)] text-left">
                    {["Property", "Sold", "Sold price", "DOM", "Listing agent", "Buyer agent", "Your contact", "Links"].map((h) => (
                      <th key={h} className={`${label} px-3 py-2.5`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.matched.map((m) => {
                    const fub = fubLink(m.contact.fubPersonId);
                    const former = matchFormer(m.listAgent);
                    return (
                      <tr
                        key={m.mlsNumber}
                        className="border-b border-[var(--color-line)] last:border-0"
                        style={former ? { background: "rgba(180,67,58,0.06)" } : undefined}
                      >
                        <td className={cell}>
                          <div className="font-semibold">{m.address || "—"}</div>
                          <div className="text-[var(--color-muted)]">
                            {[m.city, m.zip].filter(Boolean).join(", ")} · MLS {m.mlsNumber}
                          </div>
                        </td>
                        <td className={cell}>{m.soldDate || "—"}</td>
                        <td className={cell}>{money(m.soldPrice)}</td>
                        <td className={cell}>{m.dom ?? "—"}</td>
                        <td className={cell}>
                          {m.listAgent || "—"}
                          {former && (
                            <div className="mt-0.5 font-semibold text-[#b4433a]">⚠️ Former teammate</div>
                          )}
                        </td>
                        <td className={cell}>{m.buyerAgent || "—"}</td>
                        <td className={cell}>
                          <div className="font-semibold">
                            {[m.contact.firstName, m.contact.lastName].filter(Boolean).join(" ") || "—"}
                          </div>
                          <div className="text-[var(--color-muted)]">
                            {m.contact.phone || m.contact.email || "no contact on file"}
                          </div>
                        </td>
                        <td className={cell}>
                          <div className="flex flex-col gap-1">
                            {fub && (
                              <a
                                href={fub}
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-[var(--color-gold)] hover:underline"
                              >
                                Open in FUB →
                              </a>
                            )}
                            <a
                              href={dashboardUrl(m.contact.token)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[var(--color-ink-soft)] hover:underline"
                            >
                              Dashboard →
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-4 font-sans text-[0.66rem] text-[var(--color-muted)]">
            Read-only — pulls sold listings from the MLS and matches them to your contacts by street number + street +
            ZIP. The listing agent is shown so you can flag a sale that may owe a referral.
          </p>
        </>
      )}
    </div>
  );
}
