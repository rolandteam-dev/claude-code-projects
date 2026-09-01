"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { RosterClient } from "@/app/api/team/clients/route";
import { useOrigin, useSessionValue } from "@/lib/portal/browser";
import { Card, CardTitle, EmptyState, Pill, fieldClass, labelClass, money } from "@/components/portal/ui";

/**
 * Internal agent console.
 *
 * Two jobs: show the team who's active in the portal (read live from Follow Up
 * Boss), and generate a pre-filled hub link to send a client.
 *
 * On access: the passcode is checked server-side in /api/team/clients and no
 * client record is returned without it. The page shell itself is public static
 * HTML — this site has no auth system — so treat the passcode as a shared team
 * secret and don't put anything sensitive in the markup here.
 */

const PASS_KEY = "rl.team.pass";

type Filter = "all" | "quiet" | "buy" | "sell";

type RosterResult =
  | { ok: true; configured: boolean; clients: RosterClient[] }
  | { ok: false; error: string };

/** Persist (or clear) the passcode for this tab session. Storage may be blocked. */
function remember(code: string | null) {
  try {
    if (code) window.sessionStorage.setItem(PASS_KEY, code);
    else window.sessionStorage.removeItem(PASS_KEY);
  } catch {
    /* ignore — the console just asks again next refresh */
  }
}

export function AgentConsole() {
  // null = untouched, so the field shows the session's stored passcode.
  const [typedPass, setTypedPass] = useState<string | null>(null);
  const [clients, setClients] = useState<RosterClient[] | null>(null);
  const [configured, setConfigured] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  /** Fetch only — no state is touched here, so callers control the render flow. */
  const fetchRoster = useCallback(async (code: string): Promise<RosterResult> => {
    try {
      const res = await fetch("/api/team/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: code }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) return { ok: false, error: json.error ?? "Couldn't load the roster." };
      return { ok: true, configured: json.configured !== false, clients: json.clients as RosterClient[] };
    } catch {
      return { ok: false, error: "Network error — try again." };
    }
  }, []);

  const apply = useCallback((result: RosterResult, code: string) => {
    if (!result.ok) {
      setError(result.error);
      setClients(null);
      remember(null);
      return;
    }
    setError("");
    setConfigured(result.configured);
    setClients(result.clients);
    remember(code);
  }, []);

  /** Load with the spinner — for the sign-in form and the refresh button. */
  const load = useCallback(
    async (code: string) => {
      setLoading(true);
      setError("");
      apply(await fetchRoster(code), code);
      setLoading(false);
    },
    [apply, fetchRoster],
  );

  // Stay signed in for the tab session so a refresh doesn't cost a passcode.
  // The async body starts with an await, so restoring never sets state
  // synchronously inside the effect.
  const storedPass = useSessionValue(PASS_KEY);
  useEffect(() => {
    if (!storedPass) return;
    let cancelled = false;
    void (async () => {
      const result = await fetchRoster(storedPass);
      if (!cancelled) apply(result, storedPass);
    })();
    return () => {
      cancelled = true;
    };
  }, [storedPass, fetchRoster, apply]);

  const passcode = typedPass ?? storedPass;

  const filtered = useMemo(() => {
    const list = clients ?? [];
    const byFilter =
      filter === "quiet"
        ? list.filter((c) => (c.quietDays ?? 999) >= 7)
        : filter === "all"
          ? list
          : list.filter((c) => c.journey === filter);
    return [...byFilter].sort((a, b) => (b.quietDays ?? -1) - (a.quietDays ?? -1));
  }, [clients, filter]);

  if (clients === null) {
    return (
      <div className="mx-auto max-w-[420px]">
        <Card>
          <CardTitle>Team access</CardTitle>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void load(passcode);
            }}
          >
            <label className="block">
              <span className={labelClass}>Passcode</span>
              <input
                className={`${fieldClass} mt-1`}
                type="password"
                value={passcode}
                onChange={(e) => setTypedPass(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            <button type="submit" disabled={loading} className="btn mt-4 w-full disabled:opacity-60">
              {loading ? "Checking…" : "Open console"}
            </button>
          </form>
          {error && <p className="mt-3 font-sans text-[0.85rem] text-[var(--color-ink-soft)]">{error}</p>}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <CardTitle hint={`${clients.length} portal ${clients.length === 1 ? "client" : "clients"}`}>
            Portal roster
          </CardTitle>
          <button
            type="button"
            onClick={() => void load(passcode)}
            className="font-sans text-[0.78rem] uppercase tracking-[0.1em] text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {!configured ? (
          <EmptyState title="Follow Up Boss isn't connected yet">
            Add <code>FUB_API_KEY</code> in Vercel → Settings → Environment Variables and the roster fills in
            automatically. Portal clients are tagged <strong>Client Portal</strong> in FUB.
          </EmptyState>
        ) : clients.length === 0 ? (
          <EmptyState title="No portal clients yet">
            Send a client their hub link with the builder below. As soon as they set it up, they appear here — and every
            saved home, completed step and question lands on their FUB record.
          </EmptyState>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              {(
                [
                  { v: "all", label: "Everyone" },
                  { v: "quiet", label: "Quiet 7+ days" },
                  { v: "buy", label: "Buyers" },
                  { v: "sell", label: "Sellers" },
                ] as const
              ).map((f) => (
                <button
                  key={f.v}
                  type="button"
                  onClick={() => setFilter(f.v)}
                  aria-pressed={filter === f.v}
                  className={[
                    "rounded-full border px-4 py-1.5 font-sans text-[0.82rem] transition-colors",
                    filter === f.v
                      ? "border-[var(--color-graphite)] bg-[var(--color-graphite)] text-white"
                      : "border-[var(--color-line)] bg-white text-[var(--color-ink-soft)] hover:border-[var(--color-graphite)]",
                  ].join(" ")}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto rounded-[14px] border border-[var(--color-line)] bg-white">
              <table className="w-full border-collapse font-sans text-[0.88rem]">
                <thead>
                  <tr className="border-b border-[var(--color-line)] text-left">
                    {["Client", "Journey", "Stage", "Last activity", "Assigned", ""].map((h) => (
                      <th key={h} className="whitespace-nowrap px-4 py-3 text-[0.7rem] uppercase tracking-[0.1em] text-[var(--color-muted)]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={`${c.id}-${c.email}`} className="border-b border-[var(--color-line)] last:border-0">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[var(--color-ink)]">{c.name}</div>
                        <div className="text-[0.8rem] text-[var(--color-muted)]">{c.email || c.phone}</div>
                      </td>
                      <td className="px-4 py-3">
                        {c.journey === "unknown" ? (
                          <span className="text-[var(--color-muted)]">—</span>
                        ) : (
                          <Pill tone="sand">{c.journey === "sell" ? "Seller" : "Buyer"}</Pill>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[var(--color-ink-soft)]">{c.stage || "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {c.quietDays === null ? (
                          <span className="text-[var(--color-muted)]">—</span>
                        ) : (
                          <span className={c.quietDays >= 14 ? "font-semibold text-[var(--color-gold)]" : "text-[var(--color-ink-soft)]"}>
                            {c.quietDays === 0 ? "Today" : `${c.quietDays}d ago`}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[var(--color-ink-soft)]">{c.assignedTo || "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        {c.fubUrl && (
                          <a href={c.fubUrl} target="_blank" rel="noreferrer" className="link-gold">
                            Open in FUB →
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <p className="mt-3 font-sans text-[0.88rem] text-[var(--color-muted)]">Nobody matches that filter.</p>
            )}
          </>
        )}
      </section>

      <InviteBuilder />
      <SignalPlaybook />
    </div>
  );
}

/* --------------------------------------------------------------- invites -- */

function InviteBuilder() {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [journey, setJourney] = useState<"buy" | "sell">("buy");
  const [budget, setBudget] = useState("");
  const [copied, setCopied] = useState(false);
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

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the field is selectable as a fallback */
    }
  }

  return (
    <section>
      <CardTitle hint="No login required">Send a client their hub</CardTitle>
      <Card>
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
            <input className={`${fieldClass} mt-1`} inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="750,000" />
          </label>
        </div>

        <div className="mt-6">
          <span className={labelClass}>Hub link</span>
          <div className="mt-1 flex flex-wrap gap-3">
            <input readOnly value={link} className={`${fieldClass} flex-1 !text-[0.82rem]`} onFocus={(e) => e.currentTarget.select()} />
            <button type="button" onClick={() => void copy(link)} className="btn !px-6 !py-3">
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
          <button type="button" onClick={() => void copy(message)} className="link-gold mt-3 inline-block">
            Copy a ready-to-send text message →
          </button>
        </div>
      </Card>
    </section>
  );
}

/* -------------------------------------------------------------- playbook -- */

const SIGNALS: { tag: string; means: string; action: string }[] = [
  {
    tag: "Portal: saved-home",
    means: "They saved a specific address. The message carries the address.",
    action: "Send comps on that home within the day. This is the highest-intent signal in the portal.",
  },
  {
    tag: "Portal: tour-request",
    means: "They asked for a showing from their saved list.",
    action: "Call, don't text. Book it before the weekend fills.",
  },
  {
    tag: "Portal: stage-complete",
    means: "They finished a whole stage — pre-approval done, inspection done, and so on.",
    action: "Congratulate them and set up the next stage. Natural, non-salesy touchpoint.",
  },
  {
    tag: "Portal: budget",
    means: "They ran their own numbers. Often means the price conversation is live.",
    action: "Offer to walk the numbers together, or loop the lender in.",
  },
  {
    tag: "Portal: vendor-intro",
    means: "They want an introduction — lender, inspector, title, movers.",
    action: "Make the intro personally, same day. Reply-all so they see you did it.",
  },
  {
    tag: "Portal: message",
    means: "They asked a question in the hub. The full text is in the event.",
    action: "Answer it directly. Unanswered portal questions are how clients drift.",
  },
];

function SignalPlaybook() {
  return (
    <section>
      <CardTitle hint="What the FUB tags mean">Signal playbook</CardTitle>
      <p className="-mt-2 mb-5 max-w-[70ch] font-sans text-[0.9rem] text-[var(--color-ink-soft)]">
        Portal activity posts to Follow Up Boss as tagged events on the client&apos;s record, so nobody has to check a
        second system. Build smart lists off these tags.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {SIGNALS.map((s) => (
          <Card key={s.tag}>
            <code className="font-sans text-[0.78rem] font-semibold text-[var(--color-gold)]">{s.tag}</code>
            <p className="mt-2 font-sans text-[0.88rem] text-[var(--color-ink-soft)]">{s.means}</p>
            <p className="mt-2 font-sans text-[0.88rem] font-semibold text-[var(--color-ink)]">{s.action}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
