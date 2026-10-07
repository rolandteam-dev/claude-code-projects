import type { Metadata } from "next";
import { homeownerStore, type Homeowner } from "@/lib/homeowners/store";
import { isEligible } from "@/lib/homeowners/eligibility";
import { AdminLogin } from "@/components/AdminLogin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Engine Status — The Roland Team",
  robots: { index: false, follow: false },
};

const WORKING_SET = 3000;
const num = (v: string | undefined, d: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : d;
};
const on = (v: string | undefined) => v === "true";
const within = (iso: string | undefined, days: number) =>
  !!iso && Date.now() - new Date(iso).getTime() <= days * 86_400_000;

function Pill({ live }: { live: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-sans text-[0.68rem] font-semibold uppercase tracking-[0.08em]"
      style={{
        background: live ? "rgba(34,139,84,0.12)" : "rgba(180,67,58,0.1)",
        color: live ? "#1f7a4d" : "#b4433a",
      }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: live ? "#1f7a4d" : "#b4433a" }}
      />
      {live ? "On" : "Off"}
    </span>
  );
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-[12px] border border-[var(--color-line)] bg-white p-4">
      <div className="font-sans text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
        {label}
      </div>
      <div className="mt-1 font-serif text-[1.9rem] leading-none text-[var(--color-ink)]">{value}</div>
      {sub && <div className="mt-1 font-sans text-[0.72rem] text-[var(--color-ink-soft)]">{sub}</div>}
    </div>
  );
}

export default async function EngineStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;
  const expected = process.env.ADMIN_TOKEN;

  if (!expected) {
    return (
      <div className="mx-auto max-w-[560px] px-6 py-20 text-center">
        <h1 className="font-serif text-[1.6rem] text-[var(--color-ink)]">Engine Status is locked</h1>
        <p className="mt-3 font-sans text-[0.95rem] text-[var(--color-ink-soft)]">
          Set an <code>ADMIN_TOKEN</code> in Vercel, then open this page with <code>?key=YOUR_TOKEN</code>.
        </p>
      </div>
    );
  }
  if (key !== expected) {
    return <AdminLogin title="Engine Status" submitLabel="Open Engine Status" />;
  }

  // Engine switches (booleans only — never the secret values).
  const emailsOn = on(process.env.HOMEOWNER_EMAIL_ENABLED);
  const digestOn = on(process.env.HOMEOWNER_DIGEST_ENABLED);
  const backfillOn = on(process.env.SELLER_BACKFILL_ENABLED);
  const digestBatch = num(process.env.HOMEOWNER_DIGEST_BATCH, 50);
  const sellerDailyCap = num(process.env.SELLER_AUTO_DAILY_CAP, 40);
  const backfillPerRun = num(process.env.SELLER_BACKFILL_PER_RUN, 10);
  const sellerPerRun = num(process.env.SELLER_AUTO_MAX_PER_RUN, 25);

  // Store pipeline numbers.
  const store = homeownerStore();
  const total = await store.count();
  const loaded: Homeowner[] = await store.list(WORKING_SET);
  const eligible = loaded.filter((h) => isEligible({ email: h.email, state: h.state, zip: h.zip })).length;
  const subscribed = loaded.filter((h) => h.subscribed).length;
  const emailed7d = loaded.filter((h) => within(h.lastEmailedAt, 7)).length;
  const dueNow = (await store.listDueForEmail(14, WORKING_SET)).length;
  const sampled = total > loaded.length;
  const ofLoaded = sampled ? `of ${loaded.length.toLocaleString()} loaded` : undefined;

  const backfillDryRunHref = `/api/cron/seller-backfill?key=${encodeURIComponent(key)}&dryRun=1`;

  const field = "font-sans text-[0.8rem] text-[var(--color-ink-soft)]";

  return (
    <div className="mx-auto max-w-[920px] px-6 py-12">
      <div className="font-sans text-[0.7rem] uppercase tracking-[0.18em] text-[var(--color-gold)]">
        The Roland Team · Internal
      </div>
      <h1 className="mt-1 font-serif text-[2rem] text-[var(--color-ink)]">Email engine status</h1>
      <p className="mt-2 font-sans text-[0.9rem] text-[var(--color-ink-soft)]">
        Live view of every automated email engine and the homeowner pipeline feeding them.
      </p>

      {/* Engines */}
      <h2 className="mt-9 mb-3 font-sans text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
        Engines
      </h2>
      <div className="space-y-2">
        {[
          {
            name: "Master email switch",
            live: emailsOn,
            detail: emailsOn ? "Sending is enabled." : "All sending is off (HOMEOWNER_EMAIL_ENABLED).",
          },
          {
            name: "New-lead seller invites",
            live: emailsOn,
            detail: `Fires within ~30 min of a Seller-tagged lead. ≤${sellerPerRun}/run, ${sellerDailyCap}/day cap.`,
          },
          {
            name: "Back-catalog seller invites",
            live: emailsOn && backfillOn,
            detail: backfillOn
              ? `Sweeping existing Seller-tagged contacts at ≤${backfillPerRun}/day (daily ~9am PT).`
              : "Off — set SELLER_BACKFILL_ENABLED=true to begin the back-catalog ramp.",
          },
          {
            name: "Homeowner value digest",
            live: emailsOn && digestOn,
            detail: digestOn
              ? `Biweekly per homeowner, ≤${digestBatch}/day (daily ~10am PT).`
              : "Off — set HOMEOWNER_DIGEST_ENABLED=true to start the biweekly drip.",
          },
        ].map((e) => (
          <div
            key={e.name}
            className="flex items-center justify-between gap-4 rounded-[12px] border border-[var(--color-line)] bg-white p-4"
          >
            <div>
              <div className="font-sans text-[0.95rem] font-semibold text-[var(--color-ink)]">{e.name}</div>
              <div className={`mt-0.5 ${field}`}>{e.detail}</div>
            </div>
            <Pill live={e.live} />
          </div>
        ))}
      </div>

      {/* Pipeline */}
      <h2 className="mt-9 mb-3 font-sans text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
        Homeowner pipeline
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total homeowners" value={total.toLocaleString()} />
        <Stat label="Eligible to email" value={eligible.toLocaleString()} sub={ofLoaded} />
        <Stat label="Subscribed" value={subscribed.toLocaleString()} sub={ofLoaded} />
        <Stat label="Due for digest now" value={dueNow.toLocaleString()} sub={ofLoaded} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Emailed last 7 days" value={emailed7d.toLocaleString()} sub={ofLoaded} />
      </div>
      {sampled && (
        <p className="mt-3 font-sans text-[0.68rem] text-[var(--color-muted)]">
          Breakdowns are computed over the {loaded.length.toLocaleString()} most recent records (the total count is
          exact).
        </p>
      )}

      {/* Seller backlog check */}
      <h2 className="mt-9 mb-3 font-sans text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
        Seller back-catalog
      </h2>
      <div className="rounded-[12px] border border-[var(--color-line)] bg-white p-4">
        <p className={field}>
          The eligible back-catalog count requires a live Follow Up Boss scan, so it isn&apos;t loaded automatically.
          Run the read-only preview (sends nothing):
        </p>
        <a
          href={backfillDryRunHref}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block rounded-md border border-[var(--color-line)] px-4 py-2 font-sans text-[0.82rem] font-semibold text-[var(--color-gold)] hover:bg-[var(--color-sand)]"
        >
          Preview seller backlog (dry run) →
        </a>
        <p className="mt-2 font-sans text-[0.66rem] text-[var(--color-muted)]">
          Look at <code>eligibleFound</code> in the result.
        </p>
      </div>
    </div>
  );
}
