import type { Metadata } from "next";
import { homeownerStore, latestEstimate, appreciation, engagementScore } from "@/lib/homeowners/store";
import { dashboardUrl } from "@/lib/homeowners/brand";
import { AdminLogin } from "@/components/AdminLogin";
import { SellerRadarTable, type RadarRow } from "@/components/SellerRadarTable";
import { ImportButton } from "@/components/ImportButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Seller Radar — The Roland Team",
  robots: { index: false, follow: false },
};

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

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

  const WORKING_SET = 1000;
  const total = await homeownerStore().count();
  const all = await homeownerStore().list(WORKING_SET);
  const rows: RadarRow[] = all
    .map((h): RadarRow => {
      const latest = latestEstimate(h);
      const appr = appreciation(h);
      return {
        token: h.token,
        firstName: h.firstName,
        lastName: h.lastName,
        address: h.address,
        city: h.city,
        state: h.state,
        zip: h.zip,
        email: h.email,
        phone: h.phone,
        score: engagementScore(h),
        value: latest?.value ?? 0,
        apprPct: appr?.pct ?? null,
        views: h.views.length,
        last: lastViewed(h.views),
        subscribed: h.subscribed,
        dashUrl: dashboardUrl(h.token),
      };
    })
    .sort((a, b) => b.score - a.score || b.value - a.value);

  const hot = rows.filter((r) => r.score >= 60).length;
  const warm = rows.filter((r) => r.score >= 30 && r.score < 60).length;
  const totalValue = rows.reduce((s, r) => s + r.value, 0);

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

      {/* Import from Follow Up Boss */}
      <div className="mt-6">
        <ImportButton adminKey={key} />
      </div>

      {/* Summary tiles */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Homeowners tracked", value: total.toLocaleString() },
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

      {total > rows.length && (
        <p className="mt-6 font-sans text-[0.78rem] text-[var(--color-muted)]">
          Showing the {rows.length.toLocaleString()} most recently updated of {total.toLocaleString()} tracked
          homeowners. As homeowners engage with their dashboards, the hottest sellers rise to the top here.
        </p>
      )}

      {/* Interactive table: filters, CSV export, push-to-FUB */}
      <SellerRadarTable rows={rows} adminKey={key} />

      <p className="mt-4 font-sans text-[0.72rem] text-[var(--color-muted)]">
        Engagement score (0–100) is a behavioral signal from how recently and how often each homeowner views
        their value dashboard — a strong indicator of who&apos;s thinking about selling. It is not a purchased
        predictive model.
      </p>
    </div>
  );
}
