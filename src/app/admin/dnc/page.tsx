import type { Metadata } from "next";
import { AdminLogin } from "@/components/AdminLogin";
import { DncImport } from "@/components/DncImport";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "DNC Scrub — The Roland Team",
  robots: { index: false, follow: false },
};

export default async function DncPage({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const { key } = await searchParams;
  const expected = process.env.ADMIN_TOKEN;

  if (!expected) {
    return (
      <div className="mx-auto max-w-[560px] px-6 py-20 text-center">
        <h1 className="font-serif text-[1.6rem] text-[var(--color-ink)]">DNC Scrub is locked</h1>
        <p className="mt-3 font-sans text-[0.95rem] text-[var(--color-ink-soft)]">
          Set an <code>ADMIN_TOKEN</code> in Vercel, then open with <code>?key=YOUR_TOKEN</code>.
        </p>
      </div>
    );
  }
  if (key !== expected) {
    return <AdminLogin title="DNC Scrub" submitLabel="Open DNC Scrub" />;
  }

  return (
    <div className="mx-auto max-w-[760px] px-6 py-12">
      <div className="font-sans text-[0.7rem] uppercase tracking-[0.18em] text-[var(--color-gold)]">
        The Roland Team · Internal
      </div>
      <h1 className="mt-1 font-serif text-[2rem] text-[var(--color-ink)]">DNC scrub</h1>
      <p className="mt-2 font-sans text-[0.9rem] text-[var(--color-ink-soft)]">
        Mark the contacts who are on the federal <strong>Do Not Call</strong> registry. Run your phone list through a
        DNC-scrubbing service, then paste the numbers that came back <strong>on the list</strong> here. Matched
        homeowners are flagged <code>DNC</code> — they show email-only in{" "}
        <a href={`/admin/triage?key=${encodeURIComponent(key)}`} className="font-semibold text-[var(--color-gold)] hover:underline">
          Seller Triage
        </a>{" "}
        so agents don&apos;t cold-call them.
      </p>
      <p className="mt-2 font-sans text-[0.78rem] text-[var(--color-muted)]">
        Matching is by phone number (DNC is a calls/texts rule). Email with an unsubscribe link stays allowed, so the
        value digest is unaffected. Preview is read-only; nothing changes until you click Apply.
      </p>

      <div className="mt-6">
        <DncImport adminKey={key} />
      </div>

      <p className="mt-5 font-sans text-[0.66rem] text-[var(--color-muted)]">
        Numbers are matched to your database only; the pasted list is not stored. Re-run whenever you refresh your
        scrub. To clear a wrongly-flagged contact, update the record directly.
      </p>
    </div>
  );
}
