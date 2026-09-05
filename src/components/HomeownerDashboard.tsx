"use client";

/**
 * Homeowner value dashboard — the recipient-facing core of the Fello-style
 * engine. Shows a homeowner their current estimated value, the trend over
 * time, and total appreciation, with a one-click path to request a full CMA
 * (which drops a hot seller lead into Follow Up Boss via /api/lead). Logs a
 * view on mount as an engagement signal.
 */
import { useEffect, useState } from "react";
import { homeownerBrand } from "@/lib/homeowners/brand";
import type { Comp, ZipMarketStats } from "@/lib/idx/market";

export type DashboardProps = {
  token: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  currentValue: number;
  low?: number;
  high?: number;
  asOf: string;
  series: { date: string; value: number }[];
  appreciation: { abs: number; pct: number } | null;
  market?: ZipMarketStats | null;
  comps?: Comp[];
};

const fmtShortDate = (iso: string) =>
  iso
    ? new Date(iso + (iso.length === 10 ? "T00:00:00" : "")).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : "";

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmtDate = (iso: string) =>
  new Date(iso + (iso.length === 10 ? "T00:00:00" : "")).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

function Sparkline({ series }: { series: { date: string; value: number }[] }) {
  if (series.length < 2) return null;
  const w = 640;
  const h = 140;
  const pad = 8;
  const vals = series.map((p) => p.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const x = (i: number) => pad + (i * (w - 2 * pad)) / (series.length - 1);
  const y = (v: number) => h - pad - ((v - min) / span) * (h - 2 * pad);
  const pts = series.map((p, i) => `${x(i)},${y(p.value)}`).join(" ");
  const area = `${pad},${h - pad} ${pts} ${w - pad},${h - pad}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-4 w-full" role="img" aria-label="Estimated value over time" preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-gold)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--color-gold)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#spark)" />
      <polyline points={pts} fill="none" stroke="var(--color-gold)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(series.length - 1)} cy={y(series[series.length - 1].value)} r="4.5" fill="var(--color-gold)" />
    </svg>
  );
}

export function HomeownerDashboard(p: DashboardProps) {
  const [reportStatus, setReportStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");

  // Log a dashboard view (engagement signal) once on mount.
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/dashboard/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: p.token }),
      signal: controller.signal,
      keepalive: true,
    }).catch(() => {});
    return () => controller.abort();
  }, [p.token]);

  async function requestReport() {
    setReportStatus("sending");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: p.firstName,
          lastName: p.lastName,
          email: p.email,
          phone: p.phone,
          address: `${p.address}, ${p.city}, ${p.state} ${p.zip}`,
          type: "Seller Inquiry",
          source: "Homeowner Dashboard",
          tags: ["Seller Lead", "Homeowner Dashboard", "Requested CMA"],
          message: `Requested a full CMA from their home value dashboard. Automated estimate at request: ${money(
            p.currentValue
          )}.`,
        }),
      });
      const json = await res.json().catch(() => ({ ok: false }));
      setReportStatus(res.ok && json.ok ? "ok" : "error");
    } catch {
      setReportStatus("error");
    }
  }

  const up = p.appreciation && p.appreciation.abs >= 0;

  return (
    <div className="mx-auto max-w-[820px] px-6 py-10 md:py-14">
      <div className="font-sans text-[0.72rem] uppercase tracking-[0.18em] text-[var(--color-gold)]">
        {homeownerBrand.name} · Home Value Report
      </div>
      <h1 className="mt-2 font-serif text-[2rem] font-semibold leading-tight text-[var(--color-ink)] md:text-[2.4rem]">
        Hi {p.firstName}, here&apos;s your home&apos;s estimated value
      </h1>
      <p className="mt-1.5 font-sans text-[0.95rem] text-[var(--color-ink-soft)]">
        {p.address}, {p.city}, {p.state} {p.zip}
      </p>

      {/* Value card */}
      <div className="mt-7 rounded-[16px] border border-[var(--color-line)] bg-white p-7 shadow-[var(--shadow-soft)] md:p-9">
        <div className="font-sans text-[0.72rem] uppercase tracking-[0.14em] text-[var(--color-muted)]">
          Estimated value
        </div>
        <div className="mt-1 font-serif text-[3.2rem] leading-none text-[var(--color-gold)] md:text-[3.8rem]">
          {money(p.currentValue)}
        </div>
        {p.low && p.high && (
          <div className="mt-2 font-sans text-[0.95rem] text-[var(--color-ink-soft)]">
            Likely range {money(p.low)} – {money(p.high)}
          </div>
        )}
        <div className="mt-1 font-sans text-[0.8rem] text-[var(--color-muted)]">As of {fmtDate(p.asOf)}</div>

        {p.appreciation && (
          <div
            className={`mt-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 font-sans text-[0.85rem] font-semibold ${
              up ? "bg-[var(--color-gold)]/12 text-[var(--color-gold)]" : "bg-[#b4433a]/10 text-[#b4433a]"
            }`}
          >
            {up ? "▲" : "▼"} {money(Math.abs(p.appreciation.abs))} ({p.appreciation.pct >= 0 ? "+" : "−"}
            {Math.abs(p.appreciation.pct).toFixed(1)}%) since we started tracking
          </div>
        )}

        <Sparkline series={p.series} />
      </div>

      {/* Local market snapshot */}
      {p.market && (
        <div className="mt-6 rounded-[16px] border border-[var(--color-line)] bg-white p-7 shadow-[var(--shadow-soft)] md:p-9">
          <div className="font-sans text-[0.72rem] uppercase tracking-[0.14em] text-[var(--color-muted)]">
            Your local market · {p.market.zip}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <div className="font-serif text-[1.7rem] text-[var(--color-ink)]">{p.market.activeCount}</div>
              <div className="font-sans text-[0.78rem] text-[var(--color-muted)]">Homes for sale now</div>
            </div>
            <div>
              <div className="font-serif text-[1.7rem] text-[var(--color-ink)]">{money(p.market.medianList)}</div>
              <div className="font-sans text-[0.78rem] text-[var(--color-muted)]">Median list price</div>
            </div>
            <div>
              <div className="font-serif text-[1.7rem] text-[var(--color-ink)]">{p.market.medianDom}</div>
              <div className="font-sans text-[0.78rem] text-[var(--color-muted)]">Median days on market</div>
            </div>
          </div>
          <p className="mt-4 font-sans text-[0.8rem] text-[var(--color-ink-soft)]">
            Active listings in {p.market.zip} are asking a median of {money(p.market.medianPpsf)}/sqft. A rising or
            falling market changes what your home could sell for — that&apos;s what a full analysis pins down.
          </p>
        </div>
      )}

      {/* Recent nearby sales */}
      {p.comps && p.comps.length > 0 && (
        <div className="mt-6 rounded-[16px] border border-[var(--color-line)] bg-white p-7 shadow-[var(--shadow-soft)] md:p-9">
          <div className="font-sans text-[0.72rem] uppercase tracking-[0.14em] text-[var(--color-muted)]">
            Recent nearby sales
          </div>
          <div className="mt-4 divide-y divide-[var(--color-line)]">
            {p.comps.map((c, i) => (
              <div key={i} className="flex items-center justify-between gap-4 py-2.5">
                <div>
                  <div className="font-sans text-[0.92rem] font-medium text-[var(--color-ink)]">{c.address}</div>
                  <div className="font-sans text-[0.76rem] text-[var(--color-muted)]">
                    {c.beds > 0 ? `${c.beds} bd · ` : ""}
                    {c.sqft.toLocaleString()} sqft · {money(c.ppsf)}/sqft
                    {c.soldDate ? ` · sold ${fmtShortDate(c.soldDate)}` : ""}
                  </div>
                </div>
                <div className="font-serif text-[1.15rem] text-[var(--color-gold)]">{money(c.soldPrice)}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 font-sans text-[0.72rem] text-[var(--color-muted)]">
            Sold comparables near your home from the past six months (Nevada MLS).
          </p>
        </div>
      )}

      {/* CTA — request full CMA */}
      <div className="mt-6 rounded-[16px] bg-[var(--color-graphite)] p-7 text-white md:p-9">
        {reportStatus === "ok" ? (
          <>
            <div className="font-serif text-[1.5rem]">You&apos;re all set, {p.firstName} ✦</div>
            <p className="mt-2 max-w-[520px] font-sans text-[0.95rem] text-[#cfd3da]">
              {homeownerBrand.name} will prepare a precise, human home valuation for {p.address} and
              reach out shortly. Prefer to talk now?{" "}
              <a href={`tel:${homeownerBrand.phone}`} className="font-semibold text-[var(--color-gold-2)] no-underline">
                {homeownerBrand.phone}
              </a>
            </p>
          </>
        ) : (
          <>
            <div className="font-serif text-[1.6rem]">Want a precise, human valuation?</div>
            <p className="mt-2 max-w-[540px] font-sans text-[0.95rem] text-[#cfd3da]">
              This is an automated estimate. {homeownerBrand.name} can prepare a full comparative
              market analysis based on your home&apos;s condition, upgrades, and current demand — free and with no
              obligation.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={requestReport}
                disabled={reportStatus === "sending"}
                className="btn disabled:opacity-60"
              >
                {reportStatus === "sending" ? "Sending…" : "Request My Full Home Report"}
              </button>
              <a
                href={`tel:${homeownerBrand.phone}`}
                className="btn btn-ghost !border-white/30 !text-white hover:!bg-white/10"
              >
                Call {homeownerBrand.phone}
              </a>
            </div>
            {reportStatus === "error" && (
              <p className="mt-3 font-sans text-[0.82rem] text-[var(--color-gold-2)]">
                Something went wrong — please call {homeownerBrand.phone} and we&apos;ll take care of it.
              </p>
            )}
          </>
        )}
      </div>

      <p className="mt-5 text-center font-sans text-[0.72rem] leading-relaxed text-[var(--color-muted)]">
        Automated estimates use available market data and are not an appraisal or a guarantee of value. For a
        precise figure, rely on {homeownerBrand.name}&apos;s comparative market analysis.
      </p>
    </div>
  );
}
