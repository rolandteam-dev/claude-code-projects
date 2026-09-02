"use client";

/**
 * Interactive Seller Radar table: filter by tier / subscription / search,
 * export the current view to CSV, and push the hot list into Follow Up Boss in
 * one click. Data is computed server-side (see /admin/sellers) and passed in;
 * this component only filters, exports, and triggers the push action.
 */
import { useMemo, useState } from "react";

export type RadarRow = {
  token: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  email?: string;
  phone?: string;
  score: number;
  value: number;
  apprPct: number | null;
  views: number;
  last: string;
  subscribed: boolean;
  dashUrl: string;
};

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function tierOf(score: number): { label: "Hot" | "Warm" | "Quiet"; bg: string; fg: string } {
  if (score >= 60) return { label: "Hot", bg: "#fbeaea", fg: "#b4433a" };
  if (score >= 30) return { label: "Warm", bg: "#fdf3e3", fg: "#8a6d2b" };
  return { label: "Quiet", bg: "#eef0f2", fg: "#6a6f76" };
}

function toCsv(rows: RadarRow[]): string {
  const head = [
    "Name", "Address", "City", "State", "Zip", "Email", "Phone",
    "Engagement", "Tier", "Est Value", "Appreciation %", "Views", "Last Look", "Subscribed", "Dashboard",
  ];
  const esc = (v: string | number) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [
      `${r.firstName} ${r.lastName}`.trim(),
      r.address, r.city, r.state, r.zip, r.email ?? "", r.phone ?? "",
      r.score, tierOf(r.score).label, r.value || "",
      r.apprPct == null ? "" : r.apprPct.toFixed(1),
      r.views, r.last, r.subscribed ? "yes" : "no", r.dashUrl,
    ]
      .map(esc)
      .join(",")
  );
  return [head.map(esc).join(","), ...lines].join("\n");
}

export function SellerRadarTable({ rows, adminKey }: { rows: RadarRow[]; adminKey: string }) {
  const [tierFilter, setTierFilter] = useState<"all" | "hot" | "warm" | "quiet">("all");
  const [subFilter, setSubFilter] = useState<"all" | "subscribed" | "unsub">("all");
  const [q, setQ] = useState("");
  const [pushState, setPushState] = useState<"idle" | "pushing" | "done" | "error">("idle");
  const [pushMsg, setPushMsg] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((r) => {
      const t = tierOf(r.score).label.toLowerCase();
      if (tierFilter !== "all" && t !== tierFilter) return false;
      if (subFilter === "subscribed" && !r.subscribed) return false;
      if (subFilter === "unsub" && r.subscribed) return false;
      if (query) {
        const hay = `${r.firstName} ${r.lastName} ${r.address} ${r.city} ${r.zip} ${r.email ?? ""}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [rows, tierFilter, subFilter, q]);

  const hotCount = rows.filter((r) => r.score >= 60).length;

  function exportCsv() {
    const blob = new Blob([toCsv(filtered)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `seller-radar-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function pushHotList() {
    if (!window.confirm(`Tag your ${hotCount} hottest homeowners in Follow Up Boss as "Hot Seller"?`)) return;
    setPushState("pushing");
    try {
      const res = await fetch("/api/admin/push-to-fub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: adminKey, minScore: 60 }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setPushState("done");
        setPushMsg(`Tagged ${json.pushed} homeowner${json.pushed === 1 ? "" : "s"} in Follow Up Boss.`);
      } else {
        setPushState("error");
        setPushMsg(json.error || "Could not reach Follow Up Boss.");
      }
    } catch {
      setPushState("error");
      setPushMsg("Something went wrong.");
    }
  }

  const control =
    "rounded-md border border-[var(--color-line)] bg-white px-3 py-2 font-sans text-[0.85rem] text-[var(--color-ink)] focus:border-[var(--color-gold)] focus:outline-none";
  const th = "px-3 py-2 text-left font-sans text-[0.66rem] uppercase tracking-[0.08em] text-[var(--color-muted)]";
  const td = "px-3 py-3 font-sans text-[0.88rem] text-[var(--color-ink)] align-top";

  return (
    <>
      {/* Controls */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          className={`${control} min-w-[200px] flex-1`}
          placeholder="Search name, address, email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search"
        />
        <select className={control} value={tierFilter} onChange={(e) => setTierFilter(e.target.value as typeof tierFilter)} aria-label="Filter by tier">
          <option value="all">All tiers</option>
          <option value="hot">Hot</option>
          <option value="warm">Warm</option>
          <option value="quiet">Quiet</option>
        </select>
        <select className={control} value={subFilter} onChange={(e) => setSubFilter(e.target.value as typeof subFilter)} aria-label="Filter by subscription">
          <option value="all">All</option>
          <option value="subscribed">Subscribed</option>
          <option value="unsub">Unsubscribed</option>
        </select>
        <button type="button" onClick={exportCsv} className="rounded-full border border-[var(--color-line)] bg-white px-4 py-2 font-sans text-[0.82rem] font-semibold text-[var(--color-ink)] hover:border-[var(--color-gold)]">
          Export CSV ({filtered.length})
        </button>
        <button
          type="button"
          onClick={pushHotList}
          disabled={pushState === "pushing" || hotCount === 0}
          className="rounded-full bg-[var(--color-gold)] px-4 py-2 font-sans text-[0.82rem] font-semibold text-white disabled:opacity-50"
        >
          {pushState === "pushing" ? "Pushing…" : `Push ${hotCount} hot → FUB`}
        </button>
      </div>
      {pushState === "done" && <p className="mt-2 font-sans text-[0.82rem] text-[var(--color-gold)]">✓ {pushMsg}</p>}
      {pushState === "error" && <p className="mt-2 font-sans text-[0.82rem] text-[#b4433a]">{pushMsg}</p>}

      <div className="mt-4 overflow-x-auto rounded-[12px] border border-[var(--color-line)] bg-white">
        <table className="w-full min-w-[820px] border-collapse">
          <thead className="border-b border-[var(--color-line)] bg-[var(--color-sand)]">
            <tr>
              <th className={th}>Signal</th>
              <th className={th}>Homeowner</th>
              <th className={th}>Property</th>
              <th className={th}>Est. value</th>
              <th className={th}>Appreciation</th>
              <th className={th}>Views</th>
              <th className={th}>Last look</th>
              <th className={th}>Contact</th>
              <th className={th}>Dashboard</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td className={td} colSpan={9}>
                  No homeowners match. {rows.length === 0 ? "Import your database via the FUB sync or the home-value funnel." : "Try clearing the filters."}
                </td>
              </tr>
            )}
            {filtered.map((r) => {
              const t = tierOf(r.score);
              return (
                <tr key={r.token} className="border-b border-[var(--color-line)] last:border-0">
                  <td className={td}>
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-sans text-[0.7rem] font-semibold" style={{ background: t.bg, color: t.fg }}>
                      {t.label} · {r.score}
                    </span>
                  </td>
                  <td className={td}>
                    {r.firstName} {r.lastName}
                    {!r.subscribed && <span className="ml-1 font-sans text-[0.66rem] text-[var(--color-muted)]">(unsub)</span>}
                  </td>
                  <td className={td}>
                    {r.address}
                    <div className="text-[0.76rem] text-[var(--color-muted)]">
                      {r.city}, {r.state} {r.zip}
                    </div>
                  </td>
                  <td className={td}>{r.value ? money(r.value) : "—"}</td>
                  <td className={td}>
                    {r.apprPct == null ? "—" : (
                      <span style={{ color: r.apprPct >= 0 ? "#8a6d2b" : "#b4433a" }}>
                        {r.apprPct >= 0 ? "+" : "−"}{Math.abs(r.apprPct).toFixed(1)}%
                      </span>
                    )}
                  </td>
                  <td className={td}>{r.views}</td>
                  <td className={td}>{r.last}</td>
                  <td className={td}>
                    <div className="text-[0.8rem]">
                      {r.email && <a href={`mailto:${r.email}`} className="text-[var(--color-gold)] no-underline">{r.email}</a>}
                      {r.phone && <div className="text-[var(--color-ink-soft)]">{r.phone}</div>}
                    </div>
                  </td>
                  <td className={td}>
                    <a href={r.dashUrl} target="_blank" rel="noreferrer" className="text-[var(--color-gold)] no-underline">Open →</a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
