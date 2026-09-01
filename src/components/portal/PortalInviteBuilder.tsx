"use client";

import { useMemo, useState } from "react";
import { useOrigin } from "@/lib/portal/browser";
import { fieldClass, labelClass, money } from "./ui";

/**
 * Builds a pre-filled hub link for a client, plus a ready-to-send message.
 * The link carries the client's details as query params, which /portal reads
 * to pre-fill sign-up — so an invited client only confirms what's there.
 */
export function PortalInviteBuilder() {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [journey, setJourney] = useState<"buy" | "sell">("buy");
  const [budget, setBudget] = useState("");
  const [copied, setCopied] = useState("");
  const origin = useOrigin();

  const link = useMemo(() => {
    const q = new URLSearchParams();
    const name = [first, last].filter(Boolean).join(" ");
    if (name) q.set("n", name);
    if (email) q.set("e", email);
    if (phone) q.set("p", phone);
    q.set("j", journey);
    const b = Number(budget.replace(/[^0-9.]/g, ""));
    if (b > 0) q.set("b", String(Math.round(b)));
    return `${origin}/portal?${q.toString()}`;
  }, [first, last, email, phone, journey, budget, origin]);

  const budgetNum = Number(budget.replace(/[^0-9.]/g, ""));
  const message = `Hi ${first || "there"} — I set up your home hub. It has your ${
    journey === "sell" ? "selling" : "buying"
  } plan step by step, your saved homes${
    budgetNum > 0 ? `, and your numbers based on ${money(budgetNum)}` : ""
  }, plus the lender/inspector/title people we trust. No password — just open the link:\n\n${link}`;

  async function copy(what: "link" | "message", text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      window.setTimeout(() => setCopied(""), 2000);
    } catch {
      /* clipboard blocked — the field stays selectable as a fallback */
    }
  }

  return (
    <div className="rounded-[12px] border border-[var(--color-line)] bg-white p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>First name</span>
          <input className={`${fieldClass} mt-1`} value={first} onChange={(e) => setFirst(e.target.value)} />
        </label>
        <label className="block">
          <span className={labelClass}>Last name</span>
          <input className={`${fieldClass} mt-1`} value={last} onChange={(e) => setLast(e.target.value)} />
        </label>
        <label className="block">
          <span className={labelClass}>Email</span>
          <input className={`${fieldClass} mt-1`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block">
          <span className={labelClass}>Mobile</span>
          <input className={`${fieldClass} mt-1`} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <label className="block">
          <span className={labelClass}>Journey</span>
          <select
            className={`${fieldClass} mt-1`}
            value={journey}
            onChange={(e) => setJourney(e.target.value === "sell" ? "sell" : "buy")}
          >
            <option value="buy">Buying</option>
            <option value="sell">Selling</option>
          </select>
        </label>
        <label className="block">
          <span className={labelClass}>Target price</span>
          <input
            className={`${fieldClass} mt-1`}
            inputMode="numeric"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="750,000"
          />
        </label>
      </div>

      <div className="mt-6">
        <span className={labelClass}>Hub link</span>
        <div className="mt-1 flex flex-wrap gap-3">
          <input
            readOnly
            value={link}
            aria-label="Hub link"
            className={`${fieldClass} flex-1 !text-[0.82rem]`}
            onFocus={(e) => e.currentTarget.select()}
          />
          <button
            type="button"
            onClick={() => void copy("link", link)}
            className="rounded-full bg-[var(--color-gold)] px-6 py-2.5 font-sans text-[0.85rem] font-semibold text-white"
          >
            {copied === "link" ? "Copied" : "Copy link"}
          </button>
        </div>
        <button
          type="button"
          onClick={() => void copy("message", message)}
          className="mt-3 font-sans text-[0.82rem] font-semibold text-[var(--color-gold)] hover:underline"
        >
          {copied === "message" ? "Message copied" : "Copy a ready-to-send text message →"}
        </button>
      </div>
    </div>
  );
}
