"use client";

/**
 * The one form on rebate.therolandteam.com: name, email, phone, timeline,
 * price range, consent. Phone is required here (unlike the guide page)
 * because the next step is a call to register the buyer with the builder,
 * and a rebate lead without a phone number is a lead we cannot register.
 *
 * Posts to /api/rebate/request, which drops the lead into Follow Up Boss with
 * the channel as its Source (YouTube unless the link said otherwise), the
 * "New Construction Rebate" tag, and a note with the timeline, price range
 * and the video the link was in. Then the visitor lands on the thank-you
 * screen, whose one ask is to book the call.
 *
 * Attribution rides on the URL the visitor arrived with, same as the guide:
 *   ?s=ig       channel (see channelSources); none means YouTube
 *   ?v=<id>     the YouTube video the link was in, kept in the FUB note
 *   ?ref=<text> anything else worth keeping (a campaign name, a short code)
 */
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { priceRangeOptions, rebateConsentText, timelineOptions } from "@/content/newConstructionRebate";

const field =
  "box-border h-14 w-full rounded-[14px] border border-[#d9d4ca] bg-white px-4 font-sans text-[17px] text-ink placeholder:text-[#9aa0aa] focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10";
const select = `${field} appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2314161b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")] bg-[length:16px_16px] bg-[right_16px_center] bg-no-repeat pr-11`;
const label = "font-sans text-[13px] font-semibold tracking-[0.04em] text-muted-2";

export function RebateForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [timeline, setTimeline] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [consent, setConsent] = useState(false);
  const [company, setCompany] = useState(""); // honeypot, stays empty for humans
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState("");

  // On rebate.therolandteam.com the page is served at "/" (middleware
  // rewrite), so the confirmation lives at "/thank-you" there and
  // "/rebate/thank-you" everywhere else.
  const atRoot = typeof window !== "undefined" && window.location.pathname === "/";
  const firstWord = name.trim().split(/\s+/)[0] ?? "";
  const thankYouHref = `${atRoot ? "" : "/rebate"}/thank-you${firstWord ? `?first=${encodeURIComponent(firstWord)}` : ""}`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const nm = name.trim();
    const em = email.trim();
    const ph = phone.replace(/\D/g, "");
    if (!nm) return fail("Add your name so we know who we are registering.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return fail("That email does not look right.");
    if (ph.length < 10) return fail("We need a phone number to register you with the builder.");
    if (!timeline) return fail("Pick a timeline, even a rough one.");
    if (!priceRange) return fail("Pick a price range, even a rough one.");
    if (!consent) return fail("Please check the consent box so we can reach you.");

    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/rebate/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nm,
          email: em,
          phone: phone.trim(),
          timeline,
          priceRange,
          consent: true,
          company,
          channel: params.get("s") ?? "",
          video: params.get("v") ?? "",
          ref: params.get("ref") ?? "",
          page: typeof window !== "undefined" ? window.location.href : "",
        }),
      });
      const json = (await res.json().catch(() => ({ ok: false }))) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) return fail(json.error || "Something went wrong on our end.");
      router.push(thankYouHref);
    } catch {
      fail("Something went wrong on our end.");
    }
  }

  function fail(msg: string) {
    setStatus("error");
    setError(msg);
  }

  return (
    <form
      id="rebate-form"
      onSubmit={submit}
      noValidate
      className="relative box-border w-full max-w-[1120px] scroll-mt-24 rounded-[24px] border border-line-soft bg-white p-6 text-left shadow-[0_24px_60px_rgba(20,22,27,0.10)] md:rounded-[28px] md:px-9 md:pb-7 md:pt-8"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-6 md:gap-3.5">
        <div className="flex flex-col gap-2 md:col-span-2">
          <label htmlFor="rebate-name" className={label}>
            Name
          </label>
          <input
            id="rebate-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Sarah Johnson"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={field}
            required
          />
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <label htmlFor="rebate-email" className={label}>
            Email
          </label>
          <input
            id="rebate-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={field}
            required
          />
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <label htmlFor="rebate-phone" className={label}>
            Phone
          </label>
          <input
            id="rebate-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="(702) 555-0100"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={field}
            required
          />
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <label htmlFor="rebate-timeline" className={label}>
            When are you buying?
          </label>
          <select
            id="rebate-timeline"
            name="timeline"
            value={timeline}
            onChange={(e) => setTimeline(e.target.value)}
            className={`${select} ${timeline ? "" : "text-[#9aa0aa]"}`}
            required
          >
            <option value="" disabled>
              Pick one
            </option>
            {timelineOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <label htmlFor="rebate-price" className={label}>
            Price range
          </label>
          <select
            id="rebate-price"
            name="priceRange"
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            className={`${select} ${priceRange ? "" : "text-[#9aa0aa]"}`}
            required
          >
            <option value="" disabled>
              Pick one
            </option>
            {priceRangeOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        {/* Honeypot: hidden from people, filled by bots. */}
        <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
          <label htmlFor="rebate-company">Company</label>
          <input
            id="rebate-company"
            name="company"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>
        <div className="flex flex-col justify-end md:col-span-2">
          <button
            type="submit"
            disabled={status === "sending"}
            className="h-14 w-full rounded-full bg-ink px-7 font-sans text-[16px] font-semibold text-white transition hover:bg-graphite-2 disabled:opacity-60"
          >
            {status === "sending" ? "Sending…" : "Claim my rebate"}
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-3">
        <input
          id="rebate-consent"
          name="consent"
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-[3px] h-[18px] w-[18px] shrink-0 accent-ink"
          required
        />
        <label htmlFor="rebate-consent" className="font-sans text-[12.5px] leading-[1.5] text-muted-2">
          {rebateConsentText}
        </label>
      </div>

      {status === "error" && (
        <div role="alert" className="mt-4 font-sans text-[14px] text-[#b4433a]">
          {error}
        </div>
      )}

      <div className="mt-4 flex items-center gap-2.5 font-sans text-[14px] text-muted-2">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="text-gold-deep"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
        <span>Next step is a short call to register you before you visit a builder. Nothing to pay, ever.</span>
      </div>
    </form>
  );
}
