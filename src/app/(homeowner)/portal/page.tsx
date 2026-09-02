import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { PortalShell } from "@/components/portal/PortalShell";
import { Dashboard } from "@/components/portal/Dashboard";
import { homeownerBrand } from "@/lib/homeowners/brand";

// A private, invite-delivered client tool on the Roland Team side — same
// posture as the homeowner dashboards, so it inherits the group's noindex.
export const metadata: Metadata = {
  title: "Your Home Hub | The Roland Team",
  description:
    "Your personal home hub: a step-by-step buying or selling plan, saved homes, your real numbers, and vetted local pros — all in one place.",
};

const features = [
  {
    h: "A plan, not a pile of advice",
    p: "Every stage from pre-approval to keys, broken into steps you can actually check off — with the guide that explains each one attached.",
  },
  {
    h: "Your saved homes, kept current",
    p: "Save homes as you search. Prices and status refresh from the MLS, your private notes stay with each one, and your agent sees what you're drawn to.",
  },
  {
    h: "Your real numbers",
    p: "Monthly payment, cash to close and an affordability read — or, if you're selling, estimated net proceeds. Transparent math you can check yourself.",
  },
  {
    h: "The people you'll need",
    p: "Lender, inspector, title, insurance, movers. Ask for an introduction and your agent makes it personally, usually the same day.",
  },
];

export default function PortalPage() {
  return (
    <>
      <PortalShell
        intro={
          <section className="border-t border-[var(--color-line)] bg-white py-16">
            <Container size="wide">
              <div className="max-w-[64ch]">
                <div className="eyebrow">What&apos;s inside</div>
                <h2 className="mt-2 font-serif text-[2.4rem] leading-tight text-[var(--color-ink)]">
                  Everything about your move, in one place
                </h2>
                <p className="mt-3 font-sans text-[0.98rem] leading-relaxed text-[var(--color-ink-soft)]">
                  Buying or selling a home in Las Vegas means juggling a lender, an inspector, a title company, a
                  calendar full of deadlines and a hundred small decisions. Your hub keeps all of it straight — and keeps
                  your {homeownerBrand.name} agent close enough to help before something becomes a problem.
                </p>
              </div>

              <div className="mt-10 grid gap-8 sm:grid-cols-2">
                {features.map((f) => (
                  <div key={f.h}>
                    <span className="hairline" />
                    <h3 className="mt-3 font-sans text-[1.05rem] font-semibold text-[var(--color-ink)]">{f.h}</h3>
                    <p className="mt-2 max-w-[54ch] font-sans text-[0.92rem] leading-relaxed text-[var(--color-ink-soft)]">
                      {f.p}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-12 rounded-[14px] border border-[var(--color-line)] bg-[var(--color-sand)] p-7">
                <h3 className="font-sans text-[1.02rem] font-semibold text-[var(--color-ink)]">
                  Already working with one of our agents?
                </h3>
                <p className="mt-2 max-w-[62ch] font-sans text-[0.92rem] text-[var(--color-ink-soft)]">
                  Ask them for your hub link and everything above arrives pre-filled. Not working with us yet?{" "}
                  <Link href="/contact" className="text-[var(--color-gold)] no-underline">Start a conversation</Link> — or
                  set up your hub above and we&apos;ll take it from there.
                </p>
              </div>
            </Container>
          </section>
        }
      >
        <Dashboard />
      </PortalShell>
    </>
  );
}
