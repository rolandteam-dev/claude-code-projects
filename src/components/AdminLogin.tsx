"use client";

/**
 * Minimal access gate for the internal Seller Radar. Submits the entered key as
 * a GET ?key= to the same page, which the server compares against ADMIN_TOKEN.
 * Not a full auth system — a shared-secret gate for a single internal tool.
 */
import { useState } from "react";

export function AdminLogin() {
  const [key, setKey] = useState("");
  return (
    <div className="mx-auto max-w-[420px] px-6 py-24">
      <div className="rounded-[14px] border border-[var(--color-line)] bg-white p-8 text-center shadow-[var(--shadow-soft)]">
        <div className="font-sans text-[0.7rem] uppercase tracking-[0.18em] text-[var(--color-gold)]">
          The Roland Team
        </div>
        <h1 className="mt-2 font-serif text-[1.5rem] text-[var(--color-ink)]">Seller Radar</h1>
        <p className="mt-2 font-sans text-[0.88rem] text-[var(--color-ink-soft)]">
          Enter your access key to continue.
        </p>
        <form method="GET" className="mt-5 space-y-3">
          <input
            name="key"
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Access key"
            aria-label="Access key"
            className="w-full rounded-md border border-[var(--color-line)] bg-white px-4 py-2.5 font-sans text-[0.95rem] text-[var(--color-ink)] focus:border-[var(--color-gold)] focus:outline-none"
          />
          <button
            type="submit"
            className="w-full rounded-full bg-[var(--color-gold)] px-6 py-2.5 font-sans text-[0.9rem] font-semibold text-white"
          >
            Open Seller Radar
          </button>
        </form>
      </div>
    </div>
  );
}
