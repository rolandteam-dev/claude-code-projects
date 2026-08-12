"use client";

import { useState } from "react";
import { site } from "@/lib/site";
import { setIdentifiedEmail } from "@/lib/identity";

const field =
  "w-full rounded-md border border-[var(--color-line)] bg-white px-4 py-3 font-sans text-[0.95rem] text-[var(--color-ink)] focus:border-[var(--color-gold)] focus:outline-none";
const label = "mb-1.5 block font-sans text-[0.8rem] font-semibold text-[var(--color-ink-soft)]";

// Qualifying questions. `value` is what gets recorded; the label is what's shown.
const purpose = ["Purchase a home", "Refinance"];
const priceRanges = [
  "Under $300k",
  "$300k – $500k",
  "$500k – $750k",
  "$750k – $1M",
  "$1M – $2M",
  "$2M+",
];
const downPayments = ["Less than 5%", "5–10%", "10–20%", "20% or more", "Not sure yet"];
const creditRanges = [
  "Excellent (740+)",
  "Good (680–739)",
  "Fair (620–679)",
  "Below 620",
  "Not sure",
];
const loanTypes = ["Not sure", "Conventional", "FHA", "VA", "USDA"];
const timeframes = ["As soon as possible", "1–3 months", "3–6 months", "6–12 months", "Just researching"];

function Select({ name, options, placeholder }: { name: string; options: string[]; placeholder: string }) {
  return (
    <select className={field} name={name} defaultValue="" aria-label={placeholder}>
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export function PreApprovalForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => (fd.get(k) ? String(fd.get(k)).trim() : "");

    // Compose the qualifying answers into a readable summary for the CRM note,
    // since /api/lead maps standard contact fields + message + tags.
    const answers: [string, string][] = [
      ["Goal", get("purpose")],
      ["Price range", get("priceRange")],
      ["Down payment", get("downPayment")],
      ["Credit score", get("creditScore")],
      ["Loan type", get("loanType")],
      ["First-time buyer", get("firstTime")],
      ["Veteran / active military", fd.get("veteran") ? "Yes" : ""],
      ["Timeframe to buy", get("timeframe")],
    ];
    const summary = answers
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
    const note = get("message");
    const message = [summary, note && `Notes: ${note}`].filter(Boolean).join("\n");

    // Dynamic tags help route/segment the lead in Follow Up Boss.
    const tags = ["Buyer Lead", "Mortgage Pre-Approval"];
    if (get("purpose") === "Refinance") tags.push("Refinance");
    if (fd.get("veteran")) tags.push("VA Eligible");
    if (get("loanType") && get("loanType") !== "Not sure") tags.push(`${get("loanType")} Loan`);
    if (get("firstTime") === "Yes") tags.push("First-Time Buyer");

    const payload = {
      firstName: get("firstName"),
      lastName: get("lastName"),
      email: get("email"),
      phone: get("phone"),
      message,
      type: "Buyer Inquiry",
      tags,
      source: "Mortgage Pre-Approval Request",
    };

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({ ok: false }));
            const success = res.ok && json.ok;
            setStatus(success ? "ok" : "error");
            if (success && payload.email) setIdentifiedEmail(payload.email);
    } catch {
      setStatus("error");
    }
  }

  if (status === "ok") {
    return (
      <div className="rounded-[10px] border border-[var(--color-line)] bg-[var(--color-sand)] p-6 text-center">
        <div className="font-sans text-[1.1rem] font-semibold text-[var(--color-ink)]">Request received!</div>
        <p className="mt-2 font-sans text-[0.9rem] text-[var(--color-ink-soft)]">
          We&apos;ll match you with a trusted local lender and be in touch shortly. Prefer to talk now? Call{" "}
          <a href={`tel:${site.phone}`} className="font-semibold text-[var(--color-gold)] no-underline">
            {site.phone}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid grid-cols-2 gap-4">
        <input className={field} name="firstName" placeholder="First name" aria-label="First name" required />
        <input className={field} name="lastName" placeholder="Last name" aria-label="Last name" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <input className={field} name="email" type="email" placeholder="Email" aria-label="Email" required />
        <input className={field} name="phone" type="tel" placeholder="Phone" aria-label="Phone" />
      </div>

      <div>
        <label className={label}>What are you looking to do?</label>
        <Select name="purpose" options={purpose} placeholder="Select one" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Price range</label>
          <Select name="priceRange" options={priceRanges} placeholder="Select range" />
        </div>
        <div>
          <label className={label}>Down payment</label>
          <Select name="downPayment" options={downPayments} placeholder="Select amount" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Estimated credit score</label>
          <Select name="creditScore" options={creditRanges} placeholder="Select range" />
        </div>
        <div>
          <label className={label}>Loan type</label>
          <Select name="loanType" options={loanTypes} placeholder="Select type" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>First-time buyer?</label>
          <Select name="firstTime" options={["Yes", "No"]} placeholder="Select one" />
        </div>
        <div>
          <label className={label}>Timeframe to buy</label>
          <Select name="timeframe" options={timeframes} placeholder="Select timeframe" />
        </div>
      </div>

      <label className="flex items-center gap-2.5 font-sans text-[0.9rem] text-[var(--color-ink-soft)]">
        <input type="checkbox" name="veteran" value="yes" className="h-4 w-4 accent-[var(--color-gold)]" />
        I&apos;m a veteran or active-duty military (VA loan eligible)
      </label>

      <textarea
        className={field}
        name="message"
        rows={2}
        placeholder="Anything else we should know? (optional)"
        aria-label="Message"
      />

      <button type="submit" disabled={status === "sending"} className="btn w-full disabled:opacity-60">
        {status === "sending" ? "Sending…" : "Request Pre-Approval"}
      </button>

      <p className="text-center font-sans text-[0.72rem] leading-relaxed text-[var(--color-ink-soft)]">
        Free and no obligation. Requesting a pre-approval won&apos;t affect your credit score.
      </p>

      {status === "error" && (
        <p className="font-sans text-[0.8rem] text-red-700">
          Something went wrong. Please call {site.phone} or email{" "}
          <a href={`mailto:${site.email}`} className="underline">
            {site.email}
          </a>
          .
        </p>
      )}
    </form>
  );
}
