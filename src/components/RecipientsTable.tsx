"use client";

import { useMemo, useState } from "react";

export type RecipientRow = {
  token: string;
  name: string;
  email: string;
  phone?: string;
  city: string;
  zip: string;
  reportSent: boolean;
  emailCount: number;
  firstEmailedAt: string | null;
  lastEmailedAt: string | null;
  views: number;
  lastActivity: string | null;
  value: number;
  subscribed: boolean;
  score: number;
  dashUrl: string;
};

type SortKey = "name" | "emailCount" | "views" | "lastActivity" | "value" | "score";

const money = (n: number) =>
  n > 0 ? n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }) : "—";

function shortDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

function ago(iso: string | null): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  const days = Math.floor((Date.now() - t) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function tier(score: number): { label: string; bg: string; fg: string } {
  if (score >= 60) return { label: "Hot", bg: "#fbeaea", fg: "#b4433a" };
  if (score >= 30) return { label: "Warm", bg: "#fdf3e3", fg: "#8a6d2b" };
  return { label: "Quiet", bg: "#eef0f2", fg: "#6a6f76" };
}

export function RecipientsTable({ rows }: { rows: RecipientRow[] }) {
  const [q, setQ] = useState("");
  const [sent, setSent] = useState<"all" | "sent" | "not">("all");
  const [eng, setEng] = useState<"all" | "engaged" | "quiet">("all");
  const [sub, setSub] = useState<"all" | "yes" | "no">("all");
  const [sortKey, setSortKey] = useState<SortKey>("lastActivity");
  const [dir, setDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = rows.filter((r) => {
      if (needle) {
        const hay = `${r.name} ${r.email} ${r.city} ${r.zip} ${r.phone ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      if (sent === "sent" && !r.reportSent) return false;
      if (sent === "not" && r.reportSent) return false;
      if (eng === "engaged" && r.views <= 0) return false;
      if (eng === "quiet" && r.views > 0) return false;
      if (sub === "yes" && !r.subscribed) return false;
      if (sub === "no" && r.subscribed) return false;
      return true;
    });
    const mul = dir === "asc" ? 1 : -1;
    out.sort((a, b) => {
      let av: number | string;
      let bv: number | string;
      switch (sortKey) {
        case "name":
          av = a.name.toLowerCase();
          bv = b.name.toLowerCase();
          break;
        case "lastActivity":
          av = a.lastActivity ?? "";
          bv = b.lastActivity ?? "";
          break;
        default:
          av = a[sortKey] as number;
          bv = b[sortKey] as number;
      }
      if (av < bv) return -1 * mul;
      if (av > bv) return 1 * mul;
      return 0;
    });
    return out;
  }, [rows, q, sent, eng, sub, sortKey, dir]);

  const sentCount = rows.filter((r) => r.reportSent).length;
  const engagedCount = rows.filter((r) => r.views > 0).length;

  function toggleSort(k: SortKey) {
    if (k === sortKey) setDir(dir === "asc" ? "desc" : "asc");
    else {
      setSortKey(k);
      setDir(k === "name" ? "asc" : "desc");
    }
  }

  function exportCsv() {
    const head = [
      "Name", "Email", "Phone", "City", "ZIP", "Report sent", "Emails", "First sent",
      "Last sent", "Dashboard views", "Last activity", "Est value", "Subscribed", "Score",
    ];
    const lines = filtered.map((r) =>
      [
        r.name, r.email, r.phone ?? "", r.city, r.zip, r.reportSent ? "yes" : "no", r.emailCount,
        r.firstEmailedAt ?? "", r.lastEmailedAt ?? "", r.views, r.lastActivity ?? "", r.value || "",
        r.subscribed ? "yes" : "no", r.score,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `recipients-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const control =
    "rounded-md border border-[var(--color-line)] bg-white px-3 py-2 font-sans text-[0.82rem] text-[var(--color-ink)] focus:border-[var(--color-gold)] focus:outline-none";
  const th = "px-3 py-2.5 text-left font-sans text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]";
  const td = "px-3 py-2.5 align-top font-sans text-[0.82rem] text-[var(--color-ink)]";
  const sortMark = (k: SortKey) => (sortKey === k ? (dir === "asc" ? " ↑" : " ↓") : "");

  return (
    <div>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <input
          className={`${control} min-w-[200px] flex-1`}
          placeholder="Search name, email, city, ZIP…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search recipients"
        />
        <select className={control} value={sent} onChange={(e) => setSent(e.target.value as typeof sent)} aria-label="Report filter">
          <option value="all">All reports</option>
          <option value="sent">Report sent</option>
          <option value="not">Not sent</option>
        </select>
        <select className={control} value={eng} onChange={(e) => setEng(e.target.value as typeof eng)} aria-label="Engagement filter">
          <option value="all">All engagement</option>
          <option value="engaged">Engaged (viewed)</option>
          <option value="quiet">Quiet (no views)</option>
        </select>
        <select className={control} value={sub} onChange={(e) => setSub(e.target.value as typeof sub)} aria-label="Subscription filter">
          <option value="all">All</option>
          <option value="yes">Subscribed</option>
          <option value="no">Unsubscribed</option>
        </select>
        <button type="button" onClick={exportCsv} className={`${control} font-semibold text-[var(--color-gold)]`}>
          Export CSV
        </button>
      </div>

      <div className="mt-3 font-sans text-[0.76rem] text-[var(--color-ink-soft)]">
        Showing <strong>{filtered.length.toLocaleString()}</strong> of {rows.length.toLocaleString()} · reports sent:{" "}
        <strong>{sentCount.toLocaleString()}</strong> · engaged: <strong>{engagedCount.toLocaleString()}</strong>
      </div>

      <div className="mt-3 overflow-x-auto rounded-[12px] border border-[var(--color-line)] bg-white">
        <table className="w-full border-collapse">
          <thead className="border-b border-[var(--color-line)] bg-[var(--color-sand)]">
            <tr>
              <th className={`${th} cursor-pointer`} onClick={() => toggleSort("name")}>Recipient{sortMark("name")}</th>
              <th className={`${th} cursor-pointer`} onClick={() => toggleSort("emailCount")}>Report / emails{sortMark("emailCount")}</th>
              <th className={th}>First sent</th>
              <th className={th}>Last sent</th>
              <th className={`${th} cursor-pointer`} onClick={() => toggleSort("views")}>Views{sortMark("views")}</th>
              <th className={`${th} cursor-pointer`} onClick={() => toggleSort("lastActivity")}>Last activity{sortMark("lastActivity")}</th>
              <th className={`${th} cursor-pointer`} onClick={() => toggleSort("value")}>Est. value{sortMark("value")}</th>
              <th className={`${th} cursor-pointer`} onClick={() => toggleSort("score")}>Signal{sortMark("score")}</th>
              <th className={th}>Dashboard</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const t = tier(r.score);
              return (
                <tr key={r.token} className="border-b border-[var(--color-line)] last:border-0">
                  <td className={td}>
                    <div className="font-semibold">{r.name}</div>
                    <div className="text-[var(--color-muted)]">{r.phone || r.email || "—"}</div>
                    <div className="text-[var(--color-muted)]">{[r.city, r.zip].filter(Boolean).join(", ")}</div>
                  </td>
                  <td className={td}>
                    <span
                      className="rounded-full px-2 py-0.5 text-[0.68rem] font-semibold"
                      style={{
                        background: r.reportSent ? "rgba(34,139,84,0.12)" : "#eef0f2",
                        color: r.reportSent ? "#1f7a4d" : "#6a6f76",
                      }}
                    >
                      {r.reportSent ? "Sent" : "Not sent"}
                    </span>
                    <div className="mt-1 text-[var(--color-muted)]">{r.emailCount} email{r.emailCount === 1 ? "" : "s"}</div>
                  </td>
                  <td className={td}>{shortDate(r.firstEmailedAt)}</td>
                  <td className={td}>{shortDate(r.lastEmailedAt)}</td>
                  <td className={td}>{r.views}</td>
                  <td className={td}>{ago(r.lastActivity)}</td>
                  <td className={td}>{money(r.value)}</td>
                  <td className={td}>
                    <span className="rounded-full px-2 py-0.5 text-[0.68rem] font-semibold" style={{ background: t.bg, color: t.fg }}>
                      {t.label} · {r.score}
                    </span>
                    {!r.subscribed && <div className="mt-1 text-[0.66rem] text-[#b4433a]">unsubscribed</div>}
                  </td>
                  <td className={td}>
                    <a href={r.dashUrl} target="_blank" rel="noreferrer" className="font-semibold text-[var(--color-gold)] hover:underline">
                      Open →
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <p className="mt-4 font-sans text-[0.85rem] text-[var(--color-ink-soft)]">No recipients match these filters.</p>
      )}
    </div>
  );
}
