"use client";

/**
 * "Import from Follow Up Boss" — loops the cursor-paginated /api/cron/fub-sync
 * endpoint until the whole database has been walked, showing live progress.
 * Each call does ~45s of work and returns a nextCursor to resume, so this
 * finishes an arbitrarily large database across as many calls as needed.
 */
import { useState } from "react";

export function ImportButton({ adminKey }: { adminKey: string }) {
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [scanned, setScanned] = useState(0);
  const [added, setAdded] = useState(0);
  const [total, setTotal] = useState<number | null>(null);
  const [msg, setMsg] = useState("");

  async function run() {
    setState("running");
    setScanned(0);
    setAdded(0);
    setMsg("");
    let cursor: string | null = null;
    let cumScanned = 0;
    let cumAdded = 0;
    try {
      for (let i = 0; i < 2000; i++) {
        const q = new URLSearchParams({ key: adminKey });
        if (cursor) q.set("cursor", cursor);
        const res = await fetch(`/api/cron/fub-sync?${q.toString()}`);
        const data = await res.json();
        if (!data.ok) {
          setState("error");
          setMsg(data.error || "Import failed.");
          return;
        }
        cumAdded += data.imported || 0;
        cumScanned += (data.imported || 0) + (data.skipped || 0);
        setAdded(cumAdded);
        setScanned(cumScanned);
        if (typeof data.total === "number") setTotal(data.total);
        if (data.done || !data.nextCursor) {
          setState("done");
          setMsg(`Done — ${cumAdded.toLocaleString()} homeowners with an address are now tracked.`);
          return;
        }
        cursor = data.nextCursor;
      }
      setState("done");
      setMsg(`Imported ${cumAdded.toLocaleString()} so far — click again to continue.`);
    } catch {
      setState("error");
      setMsg("Something went wrong — try again.");
    }
  }

  const pct = total ? Math.min(100, Math.round((scanned / total) * 100)) : null;

  return (
    <div className="rounded-[12px] border border-[var(--color-line)] bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-sans text-[0.9rem] font-semibold text-[var(--color-ink)]">
            Import from Follow Up Boss
          </div>
          <div className="font-sans text-[0.78rem] text-[var(--color-ink-soft)]">
            Pulls every contact with a home address into your tracked list.
          </div>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={state === "running"}
          className="rounded-full bg-[var(--color-gold)] px-5 py-2 font-sans text-[0.85rem] font-semibold text-white disabled:opacity-60"
        >
          {state === "running" ? "Importing…" : state === "done" ? "Run again" : "Import my database"}
        </button>
      </div>

      {(state === "running" || state === "done") && (
        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-line)]">
            <div
              className="h-full rounded-full bg-[var(--color-gold)] transition-all duration-300"
              style={{ width: pct != null ? `${pct}%` : state === "done" ? "100%" : "10%" }}
            />
          </div>
          <div className="mt-1.5 font-sans text-[0.76rem] text-[var(--color-ink-soft)]">
            Scanned {scanned.toLocaleString()}
            {total ? ` of ${total.toLocaleString()}` : ""} contacts · {added.toLocaleString()} homeowners added
            {state === "running" ? "…" : ""}
          </div>
        </div>
      )}
      {msg && (
        <p className={`mt-2 font-sans text-[0.8rem] ${state === "error" ? "text-[#b4433a]" : "text-[var(--color-gold)]"}`}>
          {state === "error" ? msg : `✓ ${msg}`}
        </p>
      )}
    </div>
  );
}
