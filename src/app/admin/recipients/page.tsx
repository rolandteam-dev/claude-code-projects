import type { Metadata } from "next";
import { homeownerStore, latestEstimate, engagementScore, storeDriver, type Homeowner } from "@/lib/homeowners/store";
import { dashboardUrl } from "@/lib/homeowners/brand";
import { AdminLogin } from "@/components/AdminLogin";
import { RecipientsTable, type RecipientRow } from "@/components/RecipientsTable";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Recipients — The Roland Team",
  robots: { index: false, follow: false },
};

const WORKING_SET = 3000;

function lastView(views: string[]): string | null {
  if (!views?.length) return null;
  return [...views].sort().slice(-1)[0] ?? null;
}

export default async function RecipientsPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;
  const expected = process.env.ADMIN_TOKEN;

  if (!expected) {
    return (
      <div className="mx-auto max-w-[560px] px-6 py-20 text-center">
        <h1 className="font-serif text-[1.6rem] text-[var(--color-ink)]">Recipients is locked</h1>
        <p className="mt-3 font-sans text-[0.95rem] text-[var(--color-ink-soft)]">
          Set an <code>ADMIN_TOKEN</code> in Vercel, then open with <code>?key=YOUR_TOKEN</code>.
        </p>
      </div>
    );
  }
  if (key !== expected) {
    return <AdminLogin title="Recipients" submitLabel="Open Recipients" />;
  }

  const all: Homeowner[] = await homeownerStore().list(WORKING_SET);
  const total = await homeownerStore().count();
  const rows: RecipientRow[] = all.map((h) => {
    const est = latestEstimate(h);
    const lv = lastView(h.views ?? []);
    return {
      token: h.token,
      name: [h.firstName, h.lastName].filter(Boolean).join(" ") || "—",
      email: h.email,
      phone: h.phone,
      city: h.city,
      zip: h.zip,
      reportSent: (h.emailCount ?? 0) > 0 || !!h.lastEmailedAt,
      emailCount: h.emailCount ?? 0,
      firstEmailedAt: h.firstEmailedAt ?? null,
      lastEmailedAt: h.lastEmailedAt ?? null,
      views: h.views?.length ?? 0,
      lastActivity: lv ?? h.lastEmailedAt ?? null,
      value: est?.value ?? 0,
      subscribed: h.subscribed,
      score: engagementScore(h),
      dashUrl: dashboardUrl(h.token),
    };
  });

  const persisting = storeDriver() === "postgres";

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12">
      <div className="font-sans text-[0.7rem] uppercase tracking-[0.18em] text-[var(--color-gold)]">
        The Roland Team · Internal
      </div>
      <h1 className="mt-1 font-serif text-[2rem] text-[var(--color-ink)]">Recipients — delivery &amp; engagement</h1>
      <p className="mt-2 font-sans text-[0.9rem] text-[var(--color-ink-soft)]">
        Every homeowner on file: whether they&apos;ve been sent a report, how many emails they&apos;ve gotten, when,
        how much they&apos;ve engaged, and their current value — searchable, sortable, exportable.
      </p>

      {!persisting && (
        <div
          className="mt-5 flex items-start gap-3 rounded-[12px] border p-4"
          style={{ borderColor: "#b4433a", background: "rgba(180,67,58,0.08)" }}
        >
          <span className="mt-0.5">🔴</span>
          <div className="font-sans text-[0.82rem] text-[var(--color-ink)]">
            <strong>No database connected.</strong> This list is in-memory demo data, not your real contacts —
            connect Postgres in Vercel (<code>DATABASE_URL</code>) so recipients persist.
          </div>
        </div>
      )}

      {total > all.length && (
        <p className="mt-3 font-sans text-[0.7rem] text-[var(--color-muted)]">
          Showing the {all.length.toLocaleString()} most recent of {total.toLocaleString()} total.
        </p>
      )}

      <RecipientsTable rows={rows} />

      <p className="mt-4 font-sans text-[0.66rem] text-[var(--color-muted)]">
        &ldquo;Emails&rdquo; counts automated sends (welcome, seller report, digest) accurately from when counting
        was added; older records may show fewer than were actually sent. Read-only.
      </p>
    </div>
  );
}
