"use client";

import { useMemo, useState } from "react";

export type RecipientRow = {
  token: string;
  name: string;
  email: string;
  phone?: string;
  address: string;
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
type Action = "unsubscribe" | "resubscribe" | "delete";

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

export function RecipientsTable({ rows, adminKey }: { rows: RecipientRow[]; adminKey: string }) {
  const [data, setData] = useState<RecipientRow[]>(rows);
  const [q, setQ] = useState("");
  const [sent, setSent] = useState<"all" | "sent" | "not">("all");
  const [eng, setEng] = useState<"all" | "engaged" | "quiet">("all");
  const [sub, setSub] = useState<"all" | "yes" | "no">("all");
  const [sortKey, setSortKey] = useState<SortKey>("lastActivity");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = data.filter((r) => {
      if (needle) {
        const hay = `${r.name} ${r.email} ${r.address} ${r.city} ${r.zip} ${r.phone ?? ""}`.toLowerCase();
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
  }, [data, q, sent, eng, sub, sortKey, dir]);

  const sentCount = data.filter((r) => r.reportSent).length;
  const engagedCount = data.filter((r) => r.views > 0).length;

  function toggleSort(k: SortKey) {
    if (k === sortKey) setDir(dir === "asc" ? "desc" : "asc");
    else {
      setSortKey(k);
      setDir(k === "name" ? "asc" : "desc");
    }
  }

  async function act(r: RecipientRow, mode: Action) {
    if (
      mode === "delete" &&
      !window.confirm(
        `Permanently delete ${r.name || r.email}?\n\n` +
          `This erases their history and blocks the weekly Follow Up Boss sync from re-adding them. This cannot be undone.`,
      )
    ) {
      return;
    }
    setBusy(r.token);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/recipients/remove?key=${encodeURIComponent(adminKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: r.token, mode }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) throw new Error(j.error || `HTTP ${res.status}`);
      setData((prev) =>
        mode === "delete"
          ? prev.filter((x) => x.token !== r.token)
          : prev.map((x) => (x.token === r.token ? { ...x, subscribed: mode === "resubscribe" } : x)),
      );
    } catch (e) {
      setErr(`Couldn't ${mode} ${r.name || r.email}: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(null);
    }
  }

  async function sendReport(r: RecipientRow) {
    setBusy(r.token);
    setErr(null);
    setOkMsg(null);
    try {
      const res = await fetch(`/api/admin/recipients/send-report?key=${encodeURIComponent(adminKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: r.token }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string; kind?: string };
      if (!res.ok || !j.ok) throw new Error(j.error || `HTTP ${res.status}`);
      setOkMsg(`${j.kind === "invite" ? "Dashboard invite" : "Home value report"} sent to ${r.name || r.email}.`);
      const nowIso = new Date().toISOString();
      setData((prev) =>
        prev.map((x) =>
          x.token === r.token
            ? { ...x, reportSent: true, emailCount: x.emailCount + 1, lastEmailedAt: nowIso, lastActivity: nowIso }
            : x,
        ),
      );
    } catch (e) {
      setErr(`Couldn't send to ${r.name || r.email}: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(null);
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
  const actionBtn = "rounded-md border px-2 py-1 text-[0.68rem] font-semibold disabled:opacity-40 disabled:cursor-wait";

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
        Showing <strong>{filtered.length.toLocaleString()}</strong> of {data.length.toLocaleString()} · reports sent:{" "}
        <strong>{sentCount.toLocaleString()}</strong> · engaged: <strong>{engagedCount.toLocaleString()}</strong>
      </div>

      {err && (
        <div
          className="mt-3 rounded-[10px] border p-3 font-sans text-[0.8rem]"
          style={{ borderColor: "#b4433a", background: "rgba(180,67,58,0.08)", color: "#8a2f28" }}
        >
          {err}
        </div>
      )}

      {okMsg && (
        <div
          className="mt-3 rounded-[10px] border p-3 font-sans text-[0.8rem]"
          style={{ borderColor: "#1f7a4d", background: "rgba(34,139,84,0.08)", color: "#1f7a4d" }}
        >
          {okMsg}
        </div>
      )}

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
              <th className={th}>Manage</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const t = tier(r.score);
              const working = busy === r.token;
              return (
                <tr key={r.token} className="border-b border-[var(--color-line)] last:border-0">
                  <td className={td}>
                    <div className="font-semibold">{r.name}</div>
                    <div className="text-[var(--color-muted)]">{r.phone || r.email || "—"}</div>
                    <div className="text-[var(--color-muted)]">{[r.address, r.city, r.zip].filter(Boolean).join(", ")}</div>
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
                  <td className={td}>
                    <div className="flex flex-col items-start gap-1">
                      <button
                        type="button"
                        disabled={working || !r.subscribed}
                        onClick={() => sendReport(r)}
                        title={r.subscribed ? "Send this contact their home value report now" : "Re-add them first to send"}
                        className={`${actionBtn} border-[var(--color-gold)] text-[var(--color-gold)] hover:bg-[rgba(138,109,43,0.08)]`}
                      >
                        {working ? "…" : "Send report"}
                      </button>
                      {r.subscribed ? (
                        <button
                          type="button"
                          disabled={working}
                          onClick={() => act(r, "unsubscribe")}
                          title="Stop emailing them (kept on file, survives the FUB sync)"
                          className={`${actionBtn} border-[var(--color-line)] text-[var(--color-ink-soft)] hover:border-[var(--color-gold)]`}
                        >
                          Remove
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={working}
                          onClick={() => act(r, "resubscribe")}
                          title="Put them back on the email list"
                          className={`${actionBtn} border-[#1f7a4d] text-[#1f7a4d] hover:bg-[rgba(34,139,84,0.08)]`}
                        >
                          Re-add
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={working}
                        onClick={() => act(r, "delete")}
                        title="Permanently delete and block the FUB sync from re-adding them"
                        className={`${actionBtn} border-[#b4433a] text-[#b4433a] hover:bg-[rgba(180,67,58,0.08)]`}
                      >
                        {working ? "…" : "Delete"}
                      </button>
                    </div>
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
