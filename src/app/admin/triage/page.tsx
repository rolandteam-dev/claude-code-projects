import type { Metadata } from "next";
import { homeownerStore, type Homeowner } from "@/lib/homeowners/store";
import { triage, type TriageRow, type Bucket } from "@/lib/homeowners/triage";
import { dashboardUrl } from "@/lib/homeowners/brand";
import { AdminLogin } from "@/components/AdminLogin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Seller Triage — The Roland Team",
  robots: { index: false, follow: false },
};

const WORKING_SET = 3000;

const money = (n: number) =>
  n > 0 ? n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }) : "—";

function fubLink(fubPersonId?: string): string | null {
  if (!fubPersonId) return null;
  const sub = (process.env.FUB_ACCOUNT_SUBDOMAIN || "therolandteam1").trim();
  return `https://${sub}.followupboss.com/2/people/view/${encodeURIComponent(fubPersonId)}`;
}

/** email/call-text/DNC consent badge. */
function Consent({ row }: { row: TriageRow }) {
  const chip = (text: string, tone: "ok" | "no" | "warn" | "muted") => {
    const c = {
      ok: { bg: "rgba(34,139,84,0.12)", fg: "#1f7a4d" },
      no: { bg: "rgba(180,67,58,0.1)", fg: "#b4433a" },
      warn: { bg: "rgba(180,67,58,0.14)", fg: "#b4433a" },
      muted: { bg: "var(--color-sand)", fg: "var(--color-muted)" },
    }[tone];
    return (
      <span
        key={text}
        className="inline-block rounded-full px-2 py-0.5 font-sans text-[0.62rem] font-semibold"
        style={{ background: c.bg, color: c.fg }}
      >
        {text}
      </span>
    );
  };
  return (
    <div className="flex flex-wrap gap-1">
      {chip(
        row.emailConsent === true ? "Email ✓" : row.emailConsent === false ? "Email ✗" : "Email ?",
        row.emailConsent === true ? "ok" : row.emailConsent === false ? "no" : "muted",
      )}
      {row.callTextConsent === true
        ? chip("Call/Text ✓", "ok")
        : row.callTextConsent === false
          ? chip("Call/Text ✗", "no")
          : null}
      {row.dnc === true ? chip("DNC", "warn") : null}
    </div>
  );
}

function Rows({ rows }: { rows: TriageRow[] }) {
  const cell = "px-3 py-2.5 font-sans text-[0.82rem] text-[var(--color-ink)] align-top";
  const label = "font-sans text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]";
  return (
    <div className="overflow-x-auto rounded-[12px] border border-[var(--color-line)] bg-white">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-[var(--color-line)] text-left">
            {["Owner", "Intent", "Relationship", "Consent", "Recommended plan", "Links"].map((h) => (
              <th key={h} className={`${label} px-3 py-2.5`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const fub = fubLink(r.fubPersonId);
            return (
              <tr key={r.token} className="border-b border-[var(--color-line)] last:border-0">
                <td className={cell}>
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-[var(--color-muted)]">
                    {[r.city, r.zip].filter(Boolean).join(", ")}
                    {r.value > 0 ? ` · ${money(r.value)}` : ""}
                  </div>
                  <div className="text-[var(--color-muted)]">{r.phone || r.email || "no contact on file"}</div>
                </td>
                <td className={cell}>
                  <span className="font-serif text-[1.1rem] text-[var(--color-gold)]">{r.intent}</span>
                  <div className="text-[var(--color-muted)]">{r.views} view{r.views === 1 ? "" : "s"}</div>
                </td>
                <td className={cell}>{r.relationship}</td>
                <td className={cell}>
                  <Consent row={r} />
                </td>
                <td className={cell}>
                  <div className="font-semibold">{r.recommendedPlan}</div>
                  <div className="text-[var(--color-muted)]">{r.reason}</div>
                </td>
                <td className={cell}>
                  <div className="flex flex-col gap-1">
                    {fub && (
                      <a href={fub} target="_blank" rel="noreferrer" className="font-semibold text-[var(--color-gold)] hover:underline">
                        Open in FUB →
                      </a>
                    )}
                    <a href={dashboardUrl(r.token)} target="_blank" rel="noreferrer" className="text-[var(--color-ink-soft)] hover:underline">
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
  );
}

export default async function TriagePage({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const { key } = await searchParams;
  const expected = process.env.ADMIN_TOKEN;

  if (!expected) {
    return (
      <div className="mx-auto max-w-[560px] px-6 py-20 text-center">
        <h1 className="font-serif text-[1.6rem] text-[var(--color-ink)]">Seller Triage is locked</h1>
        <p className="mt-3 font-sans text-[0.95rem] text-[var(--color-ink-soft)]">
          Set an <code>ADMIN_TOKEN</code> in Vercel, then open with <code>?key=YOUR_TOKEN</code>.
        </p>
      </div>
    );
  }
  if (key !== expected) {
    return <AdminLogin title="Seller Triage" submitLabel="Open Seller Triage" />;
  }

  const all: Homeowner[] = await homeownerStore().list(WORKING_SET);
  const total = await homeownerStore().count();
  const rows = triage(all);
  const byBucket = (b: Bucket) => rows.filter((r) => r.bucket === b);
  const ready = byBucket("ready");
  const review = byBucket("review");
  const skip = byBucket("skip");

  const label = "font-sans text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]";

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12">
      <div className="font-sans text-[0.7rem] uppercase tracking-[0.18em] text-[var(--color-gold)]">
        The Roland Team · Internal
      </div>
      <h1 className="mt-1 font-serif text-[2rem] text-[var(--color-ink)]">Seller triage</h1>
      <p className="mt-2 font-sans text-[0.9rem] text-[var(--color-ink-soft)]">
        Your warmest homeowners, sorted into who to act on now — with their relationship, consent, and the FUB plan
        that fits (see <code>docs/fub-action-plans.md</code>). Highest-intent first.
      </p>
      {total > all.length && (
        <p className="mt-2 font-sans text-[0.7rem] text-[var(--color-muted)]">
          Triaging the {all.length.toLocaleString()} most recent of {total.toLocaleString()} total.
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-5 rounded-[12px] border border-[var(--color-line)] bg-[var(--color-sand)] px-5 py-3">
        <div>
          <div className={label}>Ready to act</div>
          <div className="font-serif text-[1.6rem] text-[var(--color-gold)]">{ready.length.toLocaleString()}</div>
        </div>
        <div>
          <div className={label}>Review / keep warm</div>
          <div className="font-serif text-[1.6rem] text-[var(--color-ink)]">{review.length.toLocaleString()}</div>
        </div>
        <div>
          <div className={label}>Skip (opted out / ineligible)</div>
          <div className="font-serif text-[1.6rem] text-[var(--color-muted)]">{skip.length.toLocaleString()}</div>
        </div>
      </div>

      <h2 className="mt-8 font-serif text-[1.4rem] text-[var(--color-ink)]">Ready to act — {ready.length}</h2>
      {ready.length ? (
        <div className="mt-3">
          <Rows rows={ready} />
        </div>
      ) : (
        <p className="mt-3 font-sans text-[0.9rem] text-[var(--color-ink-soft)]">Nobody in the act-now bucket right now.</p>
      )}

      <h2 className="mt-9 font-serif text-[1.4rem] text-[var(--color-ink)]">Review / keep warm — {review.length}</h2>
      {review.length ? (
        <div className="mt-3">
          <Rows rows={review.slice(0, 200)} />
          {review.length > 200 && (
            <p className="mt-2 font-sans text-[0.7rem] text-[var(--color-muted)]">Showing the first 200.</p>
          )}
        </div>
      ) : (
        <p className="mt-3 font-sans text-[0.9rem] text-[var(--color-ink-soft)]">Nothing to review.</p>
      )}

      <p className="mt-8 font-sans text-[0.66rem] text-[var(--color-muted)]">
        Read-only. Relationship is derived from the record source; consent from the <code>emailConsent</code> /{" "}
        <code>callTextConsent</code> / <code>dnc</code> fields. Recommended plans map to the FUB action plans in{" "}
        <code>docs/fub-action-plans.md</code>. {skip.length.toLocaleString()} contacts are in Skip (unsubscribed,
        declined email, or ineligible) and are not shown.
      </p>
    </div>
  );
}
