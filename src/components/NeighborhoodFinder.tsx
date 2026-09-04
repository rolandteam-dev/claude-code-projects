"use client";

/**
 * Neighborhood Finder — an interactive buyer lead magnet. Three quick questions
 * (area, budget, lifestyle priorities) score the buyer against all 42 community
 * pages and reveal their best-fit neighborhoods, each linking to its full page.
 * A contextual lead form routes the buyer + their answers into Follow Up Boss
 * via /api/lead (which degrades gracefully until the CRM key is set).
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import { site } from "@/lib/site";
import {
  AREA_OPTIONS,
  BUDGET_OPTIONS,
  LIFESTYLE_OPTIONS,
  matchCommunities,
  type Area,
  type BudgetTier,
  type Lifestyle,
} from "@/content/communityMatch";

const TOTAL_STEPS = 3;

export function NeighborhoodFinder() {
  const [step, setStep] = useState(0);
  const [area, setArea] = useState<Area | "any" | null>(null);
  const [budget, setBudget] = useState<BudgetTier | "any" | null>(null);
  const [priorities, setPriorities] = useState<Lifestyle[]>([]);

  const results = useMemo(
    () =>
      area !== null && budget !== null
        ? matchCommunities({ area, budget, priorities })
        : [],
    [area, budget, priorities]
  );

  function togglePriority(p: Lifestyle) {
    setPriorities((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  function restart() {
    setArea(null);
    setBudget(null);
    setPriorities([]);
    setStep(0);
  }

  // ---- Results view ----
  if (step === 3) {
    const areaLabel = AREA_OPTIONS.find((o) => o.value === area)?.label ?? "Anywhere";
    const budgetLabel = BUDGET_OPTIONS.find((o) => o.value === budget)?.label ?? "Any budget";
    const priorityLabels = priorities.map((p) => LIFESTYLE_OPTIONS.find((o) => o.value === p)?.label);
    return (
      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-sans text-[0.72rem] uppercase tracking-[0.16em] text-[var(--color-gold)]">
              Your top matches
            </div>
            <h2 className="mt-1 font-serif text-[1.8rem]">
              {results.length} neighborhoods that fit
            </h2>
          </div>
          <button
            type="button"
            onClick={restart}
            className="font-sans text-[0.85rem] font-semibold text-[var(--color-gold)] underline-offset-2 hover:underline"
          >
            ↺ Start over
          </button>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {results.map((r, i) => (
            <Link
              key={r.slug}
              href={`/communities/${r.slug}`}
              className="group flex flex-col rounded-[14px] border border-[var(--color-line)] bg-white p-6 no-underline shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-1"
            >
              <div className="flex items-center gap-2">
                {i === 0 && (
                  <span className="rounded-full bg-[var(--color-gold)] px-2.5 py-0.5 font-sans text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-white">
                    Best fit
                  </span>
                )}
                <span className="font-sans text-[0.72rem] uppercase tracking-[0.12em] text-[var(--color-muted)]">
                  {r.city}
                </span>
              </div>
              <h3 className="mt-2 font-serif text-[1.4rem] text-[var(--color-ink)]">{r.name}</h3>
              <p className="mt-1 font-sans text-[0.9rem] text-[var(--color-ink-soft)]">{r.note}</p>
              {r.reasons.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {[...new Set(r.reasons)].slice(0, 4).map((reason) => (
                    <span
                      key={reason}
                      className="rounded-full bg-[var(--color-sand)] px-2.5 py-1 font-sans text-[0.7rem] text-[var(--color-ink-soft)]"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              )}
              <span className="mt-4 font-sans text-[0.82rem] font-semibold text-[var(--color-gold)]">
                Explore {r.name} →
              </span>
            </Link>
          ))}
        </div>

        <LeadCapture
          area={areaLabel}
          budget={budgetLabel}
          priorities={priorityLabels.filter(Boolean) as string[]}
          matches={results.map((r) => r.name)}
        />
      </div>
    );
  }

  // ---- Question steps ----
  return (
    <div>
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between font-sans text-[0.72rem] uppercase tracking-[0.14em] text-[var(--color-muted)]">
          <span>
            Step {step + 1} of {TOTAL_STEPS}
          </span>
          <span>{Math.round(((step) / TOTAL_STEPS) * 100)}% there</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-line)]">
          <div
            className="h-full rounded-full bg-[var(--color-gold)] transition-all duration-300"
            style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      {step === 0 && (
        <Question title="Where do you want to live?" hint="Pick an area — or let us search everywhere.">
          <div className="grid gap-3 sm:grid-cols-2">
            {AREA_OPTIONS.map((o) => (
              <ChoiceButton
                key={o.value}
                label={o.label}
                sub={o.sub}
                selected={area === o.value}
                onClick={() => {
                  setArea(o.value);
                  setStep(1);
                }}
              />
            ))}
          </div>
        </Question>
      )}

      {step === 1 && (
        <Question title="What's your budget?" hint="A rough range is fine — it just tunes your matches.">
          <div className="grid gap-3 sm:grid-cols-2">
            {BUDGET_OPTIONS.map((o) => (
              <ChoiceButton
                key={o.value}
                label={o.label}
                sub={o.sub}
                selected={budget === o.value}
                onClick={() => {
                  setBudget(o.value);
                  setStep(2);
                }}
              />
            ))}
          </div>
          <BackButton onClick={() => setStep(0)} />
        </Question>
      )}

      {step === 2 && (
        <Question title="What matters most to you?" hint="Choose any that apply — or none, and we'll match on area & budget.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {LIFESTYLE_OPTIONS.map((o) => {
              const on = priorities.includes(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => togglePriority(o.value)}
                  aria-pressed={on}
                  className={`flex flex-col items-center gap-2 rounded-[12px] border px-3 py-4 text-center transition-colors ${
                    on
                      ? "border-[var(--color-gold)] bg-[var(--color-gold)]/10"
                      : "border-[var(--color-line)] bg-white hover:border-[var(--color-gold)]/50"
                  }`}
                >
                  <span className="text-[1.4rem]" aria-hidden="true">
                    {o.icon}
                  </span>
                  <span className="font-sans text-[0.8rem] font-medium leading-tight text-[var(--color-ink)]">
                    {o.label}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-7 flex items-center justify-between">
            <BackButton onClick={() => setStep(1)} inline />
            <button type="button" onClick={() => setStep(3)} className="btn">
              See my matches →
            </button>
          </div>
        </Question>
      )}
    </div>
  );
}

function Question({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="font-serif text-[1.7rem] leading-tight text-[var(--color-ink)]">{title}</h2>
      <p className="mt-1.5 font-sans text-[0.92rem] text-[var(--color-ink-soft)]">{hint}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function ChoiceButton({
  label,
  sub,
  selected,
  onClick,
}: {
  label: string;
  sub: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between rounded-[12px] border px-5 py-4 text-left transition-colors ${
        selected
          ? "border-[var(--color-gold)] bg-[var(--color-gold)]/10"
          : "border-[var(--color-line)] bg-white hover:border-[var(--color-gold)]/50"
      }`}
    >
      <span>
        <span className="block font-sans text-[1rem] font-semibold text-[var(--color-ink)]">{label}</span>
        <span className="block font-sans text-[0.8rem] text-[var(--color-ink-soft)]">{sub}</span>
      </span>
      <span className="font-serif text-[1.2rem] text-[var(--color-gold)]">→</span>
    </button>
  );
}

function BackButton({ onClick, inline = false }: { onClick: () => void; inline?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-sans text-[0.85rem] text-[var(--color-muted)] hover:text-[var(--color-ink)] ${
        inline ? "" : "mt-6"
      }`}
    >
      ← Back
    </button>
  );
}

function LeadCapture({
  area,
  budget,
  priorities,
  matches,
}: {
  area: string;
  budget: string;
  priorities: string[];
  matches: string[];
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    const summary = [
      `Neighborhood Finder quiz results:`,
      `• Area: ${area}`,
      `• Budget: ${budget}`,
      `• Priorities: ${priorities.length ? priorities.join(", ") : "none specified"}`,
      `• Top matches: ${matches.join(", ")}`,
    ].join("\n");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          type: "Buyer Inquiry",
          source: "Neighborhood Finder Quiz",
          tags: ["Buyer Lead", "Neighborhood Finder", area],
          message: summary,
        }),
      });
      const json = await res.json().catch(() => ({ ok: false }));
      setStatus(res.ok && json.ok ? "ok" : "error");
    } catch {
      setStatus("error");
    }
  }

  const field =
    "w-full rounded-md border border-[var(--color-line)] bg-white px-4 py-3 font-sans text-[0.95rem] text-[var(--color-ink)] focus:border-[var(--color-gold)] focus:outline-none";

  if (status === "ok") {
    return (
      <div className="mt-10 rounded-[16px] bg-[var(--color-graphite)] p-8 text-center text-white">
        <div className="font-serif text-[1.6rem]">Your shortlist is on its way ✦</div>
        <p className="mx-auto mt-2 max-w-[480px] font-sans text-[0.95rem] text-[#cfd3da]">
          Thanks! {site.founder.split(" ")[0]}&apos;s team will follow up with current pricing, availability,
          and homes that fit your matches. Prefer to talk now?{" "}
          <a href={`tel:${site.phone}`} className="font-semibold text-[var(--color-gold-2)] no-underline">
            {site.phone}
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10 rounded-[16px] border border-[var(--color-line)] bg-[var(--color-sand)] p-7 md:p-8">
      <div className="font-serif text-[1.5rem] text-[var(--color-ink)]">
        Get your personalized neighborhood shortlist
      </div>
      <p className="mt-1.5 max-w-[560px] font-sans text-[0.92rem] text-[var(--color-ink-soft)]">
        We&apos;ll send current pricing, availability, and homes for sale in your matched communities — plus
        off-market options you won&apos;t find on the portals. No obligation.
      </p>
      <form className="mt-5 space-y-3" onSubmit={onSubmit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <input className={field} name="firstName" placeholder="First name" aria-label="First name" required />
          <input className={field} name="lastName" placeholder="Last name" aria-label="Last name" required />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input className={field} name="email" type="email" placeholder="Email" aria-label="Email" required />
          <input className={field} name="phone" type="tel" placeholder="Phone" aria-label="Phone" />
        </div>
        <button type="submit" disabled={status === "sending"} className="btn w-full disabled:opacity-60">
          {status === "sending" ? "Sending…" : "Send Me My Shortlist"}
        </button>
        {status === "error" && (
          <p className="font-sans text-[0.8rem] text-[#b4433a]">
            Something went wrong. Please call {site.phone} or email{" "}
            <a href={`mailto:${site.email}`} className="underline">
              {site.email}
            </a>
            .
          </p>
        )}
        <p className="text-center font-sans text-[0.66rem] text-[var(--color-muted)]">
          Your info goes only to {site.name}.
        </p>
      </form>
    </div>
  );
}
