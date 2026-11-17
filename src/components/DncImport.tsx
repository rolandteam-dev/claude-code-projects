"use client";

import { useState } from "react";

type Result = {
  ok: boolean;
  mode?: string;
  submitted?: number;
  matched?: number;
  applied?: number;
  error?: string;
};

/**
 * DNC scrub paste box. Paste the phone numbers that came back ON the Do Not Call
 * registry, Preview to see how many match your database (no changes), then Apply
 * to mark them dnc=true. Posts to /api/admin/dnc/import.
 */
export function DncImport({ adminKey }: { adminKey: string }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<"" | "preview" | "apply">("");
  const [preview, setPreview] = useState<Result | null>(null);
  const [applied, setApplied] = useState<Result | null>(null);

  async function run(apply: boolean) {
    if (!text.trim() || busy) return;
    if (apply && !window.confirm("Mark the matched contacts as DNC? This writes to the database.")) return;
    setBusy(apply ? "apply" : "preview");
    if (!apply) {
      setPreview(null);
      setApplied(null);
    }
    try {
      const url = `/api/admin/dnc/import?key=${encodeURIComponent(adminKey)}${apply ? "&apply=1" : ""}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const json = (await res.json().catch(() => ({ ok: false, error: "Bad response" }))) as Result;
      if (apply) setApplied(json);
      else setPreview(json);
    } catch (e) {
      const err = { ok: false, error: String(e) };
      if (apply) setApplied(err);
      else setPreview(err);
    } finally {
      setBusy("");
    }
  }

  const canApply = !!preview?.ok && (preview.matched ?? 0) > 0 && !applied;
  const field =
    "w-full rounded-md border border-[var(--color-line)] bg-white px-3 py-2.5 font-mono text-[0.82rem] text-[var(--color-ink)] focus:border-[var(--color-gold)] focus:outline-none";

  return (
    <div className="rounded-[12px] border border-[var(--color-line)] bg-white p-5">
      <textarea
        className={field}
        rows={8}
        placeholder={"Paste the phone numbers that are ON the DNC list — one per line or a pasted CSV.\n(702) 555-1234\n702-555-9876\n..."}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setPreview(null);
          setApplied(null);
        }}
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => run(false)}
          disabled={!text.trim() || busy !== ""}
          className="rounded-md border border-[var(--color-line)] px-4 py-2 font-sans text-[0.82rem] font-semibold text-[var(--color-gold)] hover:bg-[var(--color-sand)] disabled:opacity-50"
        >
          {busy === "preview" ? "Checking…" : "Preview (no changes)"}
        </button>
        <button
          type="button"
          onClick={() => run(true)}
          disabled={!canApply || busy !== ""}
          className="btn disabled:opacity-50"
        >
          {busy === "apply" ? "Applying…" : "Apply — mark matched as DNC"}
        </button>
      </div>

      {preview && !applied && (
        <div className="mt-4 rounded-md bg-[var(--color-sand)] px-4 py-3 font-sans text-[0.85rem] text-[var(--color-ink)]">
          {preview.ok ? (
            <>
              Parsed <strong>{preview.submitted?.toLocaleString()}</strong> valid numbers ·{" "}
              <strong>{preview.matched?.toLocaleString()}</strong> match a contact in your database.{" "}
              {(preview.matched ?? 0) > 0 ? "Click Apply to mark them DNC." : "Nothing to apply."}
            </>
          ) : (
            <span className="text-[#b4433a]">{preview.error}</span>
          )}
        </div>
      )}

      {applied && (
        <div className="mt-4 rounded-md px-4 py-3 font-sans text-[0.85rem]" style={{ background: "rgba(34,139,84,0.1)", color: "#1f7a4d" }}>
          {applied.ok ? (
            <>
              Done — marked <strong>{applied.applied?.toLocaleString()}</strong> contact
              {applied.applied === 1 ? "" : "s"} as DNC. They&apos;re now email-only in triage.
            </>
          ) : (
            <span className="text-[#b4433a]">{applied.error}</span>
          )}
        </div>
      )}
    </div>
  );
}
