import type { Metadata } from "next";
import { expiredMatches } from "@/lib/idx/expired";
import { dashboardUrl } from "@/lib/homeowners/brand";
import { AdminLogin } from "@/components/AdminLogin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Expired Listings — The Roland Team",
  robots: { index: false, follow: false },
};

const money = (n: number) =>
  n > 0 ? n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }) : "—";

function fubLink(fubPersonId?: string): string | null {
  if (!fubPersonId) return null;
  const sub = (process.env.FUB_ACCOUNT_SUBDOMAIN || "therolandteam1").trim();
  return `https://${sub}.followupboss.com/2/people/view/${encodeURIComponent(fubPersonId)}`;
}

export default async function ExpiredsPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string; days?: string }>;
}) {
  const { key, days } = await searchParams;
  const expected = process.env.ADMIN_TOKEN;

  if (!expected) {
    return (
      <div className="mx-auto max-w-[560px] px-6 py-20 text-center">
        <h1 className="font-serif text-[1.6rem] text-[var(--color-ink)]">Expired Listings is locked</h1>
        <p className="mt-3 font-sans text-[0.95rem] text-[var(--color-ink-soft)]">
          Set an <code>ADMIN_TOKEN</code> in Vercel, then open with <code>?key=YOUR_TOKEN</code>.
        </p>
      </div>
    );
  }
  if (key !== expected) {
    return <AdminLogin title="Expired Listings" submitLabel="Open Expired Listings" />;
  }

  const sinceDays = Math.min(Math.max(Number(days) || 90, 1), 365);
  const result = await expiredMatches(sinceDays);

  const label = "font-sans text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]";
  const cell = "px-3 py-2.5 font-sans text-[0.82rem] text-[var(--color-ink)] align-top";

  return (
    <div className="mx-auto max-w-[1000px] px-6 py-12">
      <div className="font-sans text-[0.7rem] uppercase tracking-[0.18em] text-[var(--color-gold)]">
        The Roland Team · Internal
      </div>
      <h1 className="mt-1 font-serif text-[2rem] text-[var(--color-ink)]">Expired listings — warm matches</h1>
      <p className="mt-2 font-sans text-[0.9rem] text-[var(--color-ink-soft)]">
        Recently expired MLS listings whose owner is already in your database — call these first. Last{" "}
        {sinceDays} days.{" "}
        {[30, 90, 180].map((d) => (
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
              <div className={label}>Expired pulled</div>
              <div className="font-serif text-[1.4rem] text-[var(--color-ink)]">{result.pulled}</div>
            </div>
            <div>
              <div className={label}>Contacts indexed</div>
              <div className="font-serif text-[1.4rem] text-[var(--color-ink)]">{result.indexed.toLocaleString()}</div>
            </div>
            <div>
              <div className={label}>Matched (you own)</div>
              <div className="font-serif text-[1.4rem] text-[var(--color-gold)]">{result.matched.length}</div>
            </div>
          </div>

          {result.pulled === 0 && (
            <p className="mt-3 font-sans text-[0.72rem] text-[var(--color-muted)]">
              Zero expired listings came back from the feed — the MLS&apos;s expired status code may differ from{" "}
              <code>Exp</code>. Tell me and I&apos;ll widen the status set.
            </p>
          )}

          {result.matched.length === 0 ? (
            <div className="mt-6 rounded-[12px] border border-[var(--color-line)] bg-white p-5 font-sans text-[0.9rem] text-[var(--color-ink-soft)]">
              No expired listings in this window matched a contact in your database.
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto rounded-[12px] border border-[var(--color-line)] bg-white">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-line)] text-left">
                    {["Property", "Expired", "List price", "DOM", "Owner (in your DB)", "Links"].map((h) => (
                      <th key={h} className={`${label} px-3 py-2.5`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.matched.map((m) => {
                    const fub = fubLink(m.contact.fubPersonId);
                    return (
                      <tr key={m.mlsNumber} className="border-b border-[var(--color-line)] last:border-0">
                        <td className={cell}>
                          <div className="font-semibold">{m.address || "—"}</div>
                          <div className="text-[var(--color-muted)]">
                            {[m.city, m.zip].filter(Boolean).join(", ")} · MLS {m.mlsNumber}
                          </div>
                        </td>
                        <td className={cell}>{m.expiredDate || "—"}</td>
                        <td className={cell}>{money(m.listPrice)}</td>
                        <td className={cell}>{m.dom ?? "—"}</td>
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
            Read-only — this pulls from the MLS and reads your contacts; it writes nothing. Matching is by street
            number + street + ZIP against the {result.indexed.toLocaleString()} most recent homeowner records.
          </p>
        </>
      )}
    </div>
  );
}
