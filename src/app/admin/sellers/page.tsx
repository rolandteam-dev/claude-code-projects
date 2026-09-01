import type { Metadata } from "next";
import { homeownerStore, latestEstimate, appreciation, engagementScore } from "@/lib/homeowners/store";
import { dashboardUrl } from "@/lib/homeowners/brand";
import { AdminLogin } from "@/components/AdminLogin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Seller Radar — The Roland Team",
  robots: { index: false, follow: false },
};

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function tier(score: number): { label: string; bg: string; fg: string } {
  if (score >= 60) return { label: "Hot", bg: "#fbeaea", fg: "#b4433a" };
  if (score >= 30) return { label: "Warm", bg: "#fdf3e3", fg: "#8a6d2b" };
  return { label: "Quiet", bg: "#eef0f2", fg: "#6a6f76" };
}

function lastViewed(views: string[]): string {
  if (!views.length) return "Never";
  const last = views.map((v) => new Date(v).getTime()).sort((a, b) => b - a)[0];
  const days = Math.floor((Date.now() - last) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default async function SellerRadarPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;
  const expected = process.env.ADMIN_TOKEN;

  if (!expected) {
    return (
      <div className="mx-auto max-w-[560px] px-6 py-20 text-center">
        <h1 className="font-serif text-[1.6rem] text-[var(--color-ink)]">Seller Radar is locked</h1>
        <p className="mt-3 font-sans text-[0.95rem] text-[var(--color-ink-soft)]">
          Set an <code>ADMIN_TOKEN</code> environment variable in Vercel to enable this internal dashboard, then
          open it with <code>?key=YOUR_TOKEN</code>.
        </p>
      </div>
    );
  }

  if (key !== expected) {
    return <AdminLogin />;
  }

  const all = await homeownerStore().list();
  const rows = all
    .map((h) => {
      const latest = latestEstimate(h);
      const appr = appreciation(h);
      return {
        h,
        score: engagementScore(h),
        value: latest?.value ?? 0,
        apprPct: appr?.pct ?? null,
        views: h.views.length,
        last: lastViewed(h.views),
      };
    })
    .sort((a, b) => b.score - a.score || b.value - a.value);

  const hot = rows.filter((r) => r.score >= 60).length;
  const warm = rows.filter((r) => r.score >= 30 && r.score < 60).length;
  const totalValue = rows.reduce((s, r) => s + r.value, 0);

  const th = "px-3 py-2 text-left font-sans text-[0.66rem] uppercase tracking-[0.08em] text-[var(--color-muted)]";
  const td = "px-3 py-3 font-sans text-[0.88rem] text-[var(--color-ink)] align-top";

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-sans text-[0.7rem] uppercase tracking-[0.18em] text-[var(--color-gold)]">
            The Roland Team · Internal
          </div>
          <h1 className="mt-1 font-serif text-[2rem] text-[var(--color-ink)]">Seller Radar</h1>
          <p className="mt-1 font-sans text-[0.9rem] text-[var(--color-ink-soft)]">
            Your database ranked by engagement — who&apos;s watching their home value most closely right now.
          </p>
        </div>
      </div>

      {/* Summary tiles */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Homeowners tracked", value: rows.length.toLocaleString() },
          { label: "Hot (engaging now)", value: hot.toLocaleString() },
          { label: "Warm", value: warm.toLocaleString() },
          { label: "Portfolio value", value: money(totalValue) },
        ].map((t) => (
          <div key={t.label} className="rounded-[12px] border border-[var(--color-line)] bg-white p-4">
            <div className="font-sans text-[0.62rem] uppercase tracking-[0.1em] text-[var(--color-muted)]">
              {t.label}
            </div>
            <div className="mt-1 font-serif text-[1.5rem] text-[var(--color-ink)]">{t.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="mt-6 overflow-x-auto rounded-[12px] border border-[var(--color-line)] bg-white">
        <table className="w-full min-w-[820px] border-collapse">
          <thead className="border-b border-[var(--color-line)] bg-[var(--color-sand)]">
            <tr>
              <th className={th}>Signal</th>
              <th className={th}>Homeowner</th>
              <th className={th}>Property</th>
              <th className={th}>Est. value</th>
              <th className={th}>Appreciation</th>
              <th className={th}>Views</th>
              <th className={th}>Last look</th>
              <th className={th}>Contact</th>
              <th className={th}>Dashboard</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className={td} colSpan={9}>
                  No homeowners yet. Import your database via <code>/api/cron/fub-sync</code> or the home-value
                  funnel, and records will appear here.
                </td>
              </tr>
            )}
            {rows.map(({ h, score, value, apprPct, views, last }) => {
              const t = tier(score);
              return (
                <tr key={h.token} className="border-b border-[var(--color-line)] last:border-0">
                  <td className={td}>
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-sans text-[0.7rem] font-semibold"
                      style={{ background: t.bg, color: t.fg }}
                    >
                      {t.label} · {score}
                    </span>
                  </td>
                  <td className={td}>
                    {h.firstName} {h.lastName}
                    {!h.subscribed && (
                      <span className="ml-1 font-sans text-[0.66rem] text-[var(--color-muted)]">(unsub)</span>
                    )}
                  </td>
                  <td className={td}>
                    {h.address}
                    <div className="text-[0.76rem] text-[var(--color-muted)]">
                      {h.city}, {h.state} {h.zip}
                    </div>
                  </td>
                  <td className={td}>{value ? money(value) : "—"}</td>
                  <td className={td}>
                    {apprPct == null ? (
                      "—"
                    ) : (
                      <span style={{ color: apprPct >= 0 ? "#8a6d2b" : "#b4433a" }}>
                        {apprPct >= 0 ? "+" : "−"}
                        {Math.abs(apprPct).toFixed(1)}%
                      </span>
                    )}
                  </td>
                  <td className={td}>{views}</td>
                  <td className={td}>{last}</td>
                  <td className={td}>
                    <div className="text-[0.8rem]">
                      {h.email && (
                        <a href={`mailto:${h.email}`} className="text-[var(--color-gold)] no-underline">
                          {h.email}
                        </a>
                      )}
                      {h.phone && <div className="text-[var(--color-ink-soft)]">{h.phone}</div>}
                    </div>
                  </td>
                  <td className={td}>
                    <a
                      href={dashboardUrl(h.token)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--color-gold)] no-underline"
                    >
                      Open →
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 font-sans text-[0.72rem] text-[var(--color-muted)]">
        Engagement score (0–100) is a behavioral signal from how recently and how often each homeowner views
        their value dashboard — a strong indicator of who&apos;s thinking about selling. It is not a purchased
        predictive model.
      </p>
    </div>
  );
}
