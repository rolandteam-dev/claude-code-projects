"use client";

import { useMemo } from "react";
import { usePortal, type PortalProfile } from "@/lib/portal/store";
import { useLocationSearch } from "@/lib/portal/browser";
import { trackPortal } from "@/lib/portal/track";
import { fieldClass, labelClass } from "./ui";
import { homeownerBrand } from "@/lib/homeowners/brand";

const TIMELINES = ["ASAP", "1–3 months", "3–6 months", "6–12 months", "Just exploring"] as const;

/**
 * Portal sign-up. This is also the lead capture: on submit the profile is saved
 * to the client's browser *and* pushed to Follow Up Boss, so a new portal user
 * shows up in the CRM like any other lead.
 *
 * Agents can pre-fill this from the invite link built on /admin/clients, e.g.
 *   /portal?n=Jane%20Smith&e=jane@example.com&j=buy&b=750000
 * so an invited client only has to confirm what's already there.
 */
export function Onboarding() {
  const { setProfile } = usePortal();
  const search = useLocationSearch();

  // Derived from the URL rather than read with useSearchParams, which would opt
  // this statically prerendered page out of prerendering.
  const prefill = useMemo<Partial<PortalProfile>>(() => {
    const q = new URLSearchParams(search);
    const name = (q.get("n") ?? "").trim();
    const [first, ...rest] = name.split(/\s+/);
    const budget = Number(q.get("b"));
    return {
      firstName: first || "",
      lastName: rest.join(" "),
      email: q.get("e") ?? "",
      phone: q.get("p") ?? "",
      journey: q.get("j") === "sell" ? "sell" : "buy",
      budget: Number.isFinite(budget) && budget > 0 ? budget : 0,
    };
  }, [search]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => String(fd.get(k) ?? "").trim();
    const budget = Number(get("budget").replace(/[^0-9.]/g, ""));

    const profile: PortalProfile = {
      firstName: get("firstName"),
      lastName: get("lastName"),
      email: get("email"),
      phone: get("phone"),
      journey: get("journey") === "sell" ? "sell" : "buy",
      timeline: get("timeline"),
      budget: Number.isFinite(budget) ? budget : 0,
      areas: get("areas")
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
      createdAt: new Date().toISOString(),
    };

    setProfile(profile);
    // Written before tracking so trackPortal() can read the identity it needs.
    trackPortal("portal.start", `${profile.journey === "sell" ? "Seller" : "Buyer"} portal created`, { always: true });
  }

  return (
    <div className="mx-auto max-w-[640px]">
      <div className="rounded-[16px] border border-[var(--color-line)] bg-white p-8 shadow-[var(--shadow-soft)]">
        <div className="eyebrow">Set up your hub</div>
        <h2 className="mt-2 font-serif text-[2rem] leading-tight text-[var(--color-ink)]">
          Tell us where you are, and we&apos;ll build your plan
        </h2>
        <p className="mt-3 font-sans text-[0.92rem] text-[var(--color-ink-soft)]">
          Takes about thirty seconds. Your hub then tracks your steps, your saved homes and your numbers in one place —
          and your {homeownerBrand.name} agent can see where you need help.
        </p>

        {/* Re-key so an invite link's values populate the uncontrolled inputs
            once the query string is available after hydration. */}
        <form key={search} className="mt-7 space-y-5" onSubmit={onSubmit}>
          <fieldset>
            <legend className={labelClass}>I&apos;m here to</legend>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {(
                [
                  { v: "buy", label: "Buy a home" },
                  { v: "sell", label: "Sell a home" },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.v}
                  className="flex cursor-pointer items-center gap-3 rounded-md border border-[var(--color-line)] px-4 py-3 font-sans text-[0.92rem] has-[:checked]:border-[var(--color-gold)] has-[:checked]:bg-[var(--color-sand)]"
                >
                  <input
                    type="radio"
                    name="journey"
                    value={opt.v}
                    defaultChecked={(prefill.journey ?? "buy") === opt.v}
                    className="accent-[var(--color-gold)]"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>First name</span>
              <input className={`${fieldClass} mt-1`} name="firstName" defaultValue={prefill.firstName} required />
            </label>
            <label className="block">
              <span className={labelClass}>Last name</span>
              <input className={`${fieldClass} mt-1`} name="lastName" defaultValue={prefill.lastName} required />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Email</span>
              <input className={`${fieldClass} mt-1`} name="email" type="email" defaultValue={prefill.email} required />
            </label>
            <label className="block">
              <span className={labelClass}>Mobile</span>
              <input className={`${fieldClass} mt-1`} name="phone" type="tel" defaultValue={prefill.phone} />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Target price</span>
              <input
                className={`${fieldClass} mt-1`}
                name="budget"
                inputMode="numeric"
                placeholder="750,000"
                defaultValue={prefill.budget ? String(prefill.budget) : ""}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Timeline</span>
              <select className={`${fieldClass} mt-1`} name="timeline" defaultValue="1–3 months">
                {TIMELINES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className={labelClass}>Areas you&apos;re focused on (optional)</span>
            <input className={`${fieldClass} mt-1`} name="areas" placeholder="Summerlin, Henderson, Inspirada" />
          </label>

          <button type="submit" className="btn w-full">
            Open my hub
          </button>

          <p className="text-center font-sans text-[0.76rem] leading-relaxed text-[var(--color-muted)]">
            Your hub is saved in this browser. We share your details with your {homeownerBrand.name} agent so they can help —
            we don&apos;t sell your information, and there&apos;s no password to remember.
          </p>
        </form>
      </div>
    </div>
  );
}
