"use client";

/**
 * The one form on guide.therolandteam.com: name, email, phone (optional),
 * consent. One "Name" field instead of first + last: same friction as a
 * first-name box, and most people type both names. The API splits it (first
 * word = first name, the rest = last name) so FUB gets a full record. Posts to /api/guide/request, which drops the lead into
 * Follow Up Boss with the channel as its Source (YouTube unless the link said
 * otherwise) and emails the guide links, then sends the visitor to the
 * thank-you screen where both guides open immediately.
 *
 * Attribution rides on the URL the visitor arrived with:
 *   ?s=ig       channel (see channelSources); none means YouTube
 *   ?v=<id>     the YouTube video the link was in, kept in the FUB note
 *   ?ref=<text> anything else worth keeping (a campaign name, a short code)
 */
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { consentText } from "@/content/relocationGuides";

const field =
  "box-border h-14 w-full rounded-[14px] border border-[#d9d4ca] bg-white px-4 font-sans text-[17px] text-ink placeholder:text-[#9aa0aa] focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10";
const label = "font-sans text-[13px] font-semibold tracking-[0.04em] text-muted-2";

export function GuideForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [company, setCompany] = useState(""); // honeypot, stays empty for humans
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState("");

  // On guide.therolandteam.com the page is served at "/" (middleware rewrite),
  // so the confirmation lives at "/thank-you" there and "/guide/thank-you"
  // everywhere else.
  const atRoot = typeof window !== "undefined" && window.location.pathname === "/";
  const firstWord = name.trim().split(/\s+/)[0] ?? "";
  const thankYouHref = `${atRoot ? "" : "/guide"}/thank-you${firstWord ? `?first=${encodeURIComponent(firstWord)}` : ""}`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const nm = name.trim();
    const em = email.trim();
    if (!nm) return fail("Add your name so we know who to send them to.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return fail("That email does not look right.");
    if (!consent) return fail("Please check the consent box so we can send the guides.");

    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/guide/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nm,
          email: em,
          phone: phone.trim(),
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
      id="guide-form"
      onSubmit={submit}
      noValidate
      className="relative box-border w-full max-w-[1120px] scroll-mt-24 rounded-[24px] border border-line-soft bg-white p-6 text-left shadow-[0_24px_60px_rgba(20,22,27,0.10)] md:rounded-[28px] md:px-9 md:pb-7 md:pt-8"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-3.5">
        <div className="flex flex-col gap-2 md:flex-1">
          <label htmlFor="guide-name" className={label}>
            Name
          </label>
          <input
            id="guide-name"
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
        <div className="flex flex-col gap-2 md:flex-[1.4]">
          <label htmlFor="guide-email" className={label}>
            Email
          </label>
          <input
            id="guide-email"
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
        <div className="flex flex-col gap-2 md:flex-1">
          <label htmlFor="guide-phone" className={label}>
            Phone (optional)
          </label>
          <input
            id="guide-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="(702) 555-0100"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={field}
          />
        </div>
        {/* Honeypot: hidden from people, filled by bots. */}
        <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
          <label htmlFor="guide-company">Company</label>
          <input
            id="guide-company"
            name="company"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={status === "sending"}
          className="h-14 shrink-0 rounded-full bg-ink px-7 font-sans text-[16px] font-semibold text-white transition hover:bg-graphite-2 disabled:opacity-60"
        >
          {status === "sending" ? "Sending…" : "Send me both guides"}
        </button>
      </div>

      <div className="mt-4 flex items-start gap-3">
        <input
          id="guide-consent"
          name="consent"
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-[3px] h-[18px] w-[18px] shrink-0 accent-ink"
          required
        />
        <label htmlFor="guide-consent" className="font-sans text-[12.5px] leading-[1.5] text-muted-2">
          {consentText}
        </label>
      </div>

      {status === "error" && (
        <div role="alert" className="mt-4 font-sans text-[14px] text-[#b4433a]">
          {error}{" "}
          {error.startsWith("Something") && (
            <a href={thankYouHref} className="underline">
              Open the guides anyway.
            </a>
          )}
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
        <span>Both guides open on the next page. No waiting for an email.</span>
      </div>
    </form>
  );
}
