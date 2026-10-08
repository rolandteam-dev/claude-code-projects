"use client";

import { useState } from "react";

/**
 * Tags all currently matched expired-listing owners as "Expired" in Follow Up
 * Boss. Idempotent on the server (mergeTags), so re-clicking is harmless.
 */
export function TagExpiredButton({ count, adminKey, days }: { count: number; adminKey: string; days: number }) {
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function run() {
    if (status === "working" || count === 0) return;
    setStatus("working");
    setMsg("");
    try {
      const res = await fetch(`/api/admin/expireds/tag?key=${encodeURIComponent(adminKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      });
      const d = await res.json();
      if (d?.ok) {
        setStatus("done");
        setMsg(
          `Tagged ${d.tagged} in FUB` +
            (d.failed ? ` · ${d.failed} failed` : "") +
            (d.noFubId ? ` · ${d.noFubId} without a FUB id` : ""),
        );
      } else {
        setStatus("error");
        setMsg(d?.error ? `Couldn't tag: ${d.error}` : "Couldn't tag.");
      }
    } catch {
      setStatus("error");
      setMsg("Couldn't reach the tagging endpoint.");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={run}
        disabled={status === "working" || count === 0}
        className="rounded-md bg-[var(--color-gold)] px-4 py-2 font-sans text-[0.82rem] font-semibold text-white disabled:opacity-50"
      >
        {status === "working" ? "Tagging…" : `Tag ${count} as "Expired" in FUB`}
      </button>
      {msg && (
        <span
          className="font-sans text-[0.78rem]"
          style={{ color: status === "error" ? "#b4433a" : "#1f7a4d" }}
        >
          {msg}
        </span>
      )}
    </div>
  );
}
