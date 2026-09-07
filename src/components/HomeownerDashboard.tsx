"use client";

/**
 * Homeowner value dashboard — the recipient-facing core of the Fello-style
 * engine, laid out as a stack of modules with a sticky left nav and a sticky
 * "Contact Us" card, mirroring the Fello consumer dashboard but in The Roland
 * Team's brand. Modules: home facts, selling options, market value + trend,
 * buying video, home-equity calculator, financing, recent sales, home details.
 * Logs a view on mount and routes every CTA to Follow Up Boss via /api/lead.
 */
import { useEffect, useMemo, useState } from "react";
import { homeownerBrand } from "@/lib/homeowners/brand";
import type { Comp, ZipMarketStats } from "@/lib/idx/market";
import type { MortgageRates } from "@/lib/homeowners/rates";
import type { GoogleReviews } from "@/lib/homeowners/maps";

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
  beds?: number;
  baths?: number;
  sqft?: number;
  currentValue: number;
  low?: number;
  high?: number;
  asOf: string;
  series: { date: string; value: number }[];
  appreciation: { abs: number; pct: number } | null;
  market?: ZipMarketStats | null;
  comps?: Comp[];
  /** Buying-a-home educational video (YouTube id). */
  buyingVideoId?: string;
  /** Live mortgage-rate trends (null when FRED isn't configured). */
  rates?: MortgageRates;
  /** Static Maps image URL of the home + comps (null when Maps isn't configured). */
  mapUrl?: string | null;
  /** Google Business rating + reviews (null when Places isn't configured). */
  reviews?: GoogleReviews;
};

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmtDate = (iso: string) =>
  new Date(iso + (iso.length === 10 ? "T00:00:00" : "")).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
const fmtShortDate = (iso: string) =>
  iso
    ? new Date(iso + (iso.length === 10 ? "T00:00:00" : "")).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : "";

/* ---------- shared bits ---------- */

function Module({
  id,
  title,
  subtitle,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-6 rounded-[16px] border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-soft)] md:p-8"
    >
      <h2 className="font-serif text-[1.45rem] text-[var(--color-ink)]">{title}</h2>
      {subtitle && <p className="mt-1 font-sans text-[0.9rem] text-[var(--color-ink-soft)]">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function TrendChart({ series }: { series: { date: string; value: number }[] }) {
  if (series.length < 2) return null;
  const w = 640;
  const h = 150;
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
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 w-full" role="img" aria-label="Estimated value over time" preserveAspectRatio="none">
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

function RateChart({ rates }: { rates: NonNullable<MortgageRates> }) {
  const s = rates.series.filter((p) => p.r30 != null || p.r15 != null);
  if (s.length < 2) return null;
  const w = 640;
  const h = 170;
  const pad = 10;
  const all = s.flatMap((p) => [p.r30, p.r15].filter((v): v is number => v != null));
  const min = Math.min(...all) - 0.2;
  const max = Math.max(...all) + 0.2;
  const span = max - min || 1;
  const x = (i: number) => pad + (i * (w - 2 * pad)) / (s.length - 1);
  const y = (v: number) => h - pad - ((v - min) / span) * (h - 2 * pad);
  const line = (key: "r30" | "r15") =>
    s
      .map((p, i) => (p[key] != null ? `${x(i)},${y(p[key] as number)}` : null))
      .filter(Boolean)
      .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 w-full" role="img" aria-label="Mortgage rate trends" preserveAspectRatio="none">
      <polyline points={line("r30")} fill="none" stroke="var(--color-gold)" strokeWidth="2.5" strokeLinejoin="round" />
      <polyline points={line("r15")} fill="none" stroke="var(--color-graphite)" strokeWidth="2.5" strokeLinejoin="round" strokeDasharray="5 4" />
    </svg>
  );
}

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span aria-label={`${rating} out of 5`} className="text-[var(--color-gold)]">
      {"★★★★★".slice(0, full)}
      <span className="text-[var(--color-line)]">{"★★★★★".slice(full)}</span>
    </span>
  );
}

function Fact({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-line)] font-serif text-[0.95rem] text-[var(--color-gold)]">
        ✦
      </div>
      <div>
        <div className="font-serif text-[1.25rem] leading-none text-[var(--color-ink)]">{value}</div>
        <div className="font-sans text-[0.76rem] text-[var(--color-muted)]">{label}</div>
      </div>
    </div>
  );
}

/* ---------- interactive equity calculator ---------- */

function EquityCalculator({ estimate }: { estimate: number }) {
  const base = Math.max(estimate, 50_000);
  const [salePrice, setSalePrice] = useState(base);
  const [mortgage, setMortgage] = useState(Math.round(base * 0.45));
  const equity = Math.max(0, salePrice - mortgage);
  const minP = Math.round((base * 0.6) / 5000) * 5000;
  const maxP = Math.round((base * 1.4) / 5000) * 5000;

  return (
    <div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="font-sans text-[0.8rem] font-medium text-[var(--color-ink-soft)]">
            Est. home sale price
          </label>
          <div className="mt-1 font-serif text-[1.7rem] text-[var(--color-ink)]">{money(salePrice)}</div>
          <input
            type="range"
            min={minP}
            max={maxP}
            step={5000}
            value={salePrice}
            onChange={(e) => setSalePrice(Number(e.target.value))}
            className="mt-2 w-full accent-[var(--color-gold)]"
            aria-label="Estimated home sale price"
          />
        </div>
        <div>
          <label className="font-sans text-[0.8rem] font-medium text-[var(--color-ink-soft)]">
            Remaining mortgage balance
          </label>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-serif text-[1.3rem] text-[var(--color-muted)]">$</span>
            <input
              type="number"
              min={0}
              step={1000}
              value={mortgage}
              onChange={(e) => setMortgage(Math.max(0, Number(e.target.value)))}
              className="w-full rounded-[10px] border border-[var(--color-line)] px-3 py-2 font-sans text-[1rem] text-[var(--color-ink)]"
              aria-label="Remaining mortgage balance"
            />
          </div>
          <p className="mt-2 font-sans text-[0.74rem] text-[var(--color-muted)]">
            Enter what you still owe to see your estimated equity.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-[12px] bg-[var(--color-cream,#f6f3ec)] p-5">
        <div className="font-sans text-[0.72rem] uppercase tracking-[0.14em] text-[var(--color-muted)]">
          Estimated home equity
        </div>
        <div className="mt-1 font-serif text-[2.4rem] leading-none text-[var(--color-gold)]">{money(equity)}</div>
      </div>
      <p className="mt-3 font-sans text-[0.72rem] text-[var(--color-muted)]">
        All calculations are estimates and provided for informational purposes only. Actual amounts may vary.
      </p>
    </div>
  );
}

/* ---------- comp card ---------- */

function CompCard({ c, subjectBeds, subjectSqft }: { c: Comp; subjectBeds?: number; subjectSqft?: number }) {
  const bullets: { up: boolean; text: string }[] = [];
  if (subjectSqft && c.sqft) {
    const d = c.sqft - subjectSqft;
    if (Math.abs(d) >= 25)
      bullets.push({ up: d < 0, text: `${Math.abs(d).toLocaleString()} sqft ${d > 0 ? "larger" : "smaller"} living space` });
  }
  if (subjectBeds && c.beds) {
    const d = c.beds - subjectBeds;
    if (d !== 0) bullets.push({ up: d < 0, text: `${Math.abs(d)} ${d > 0 ? "more" : "fewer"} bedroom${Math.abs(d) > 1 ? "s" : ""}` });
  }
  return (
    <div className="rounded-[12px] border border-[var(--color-line)] p-4">
      <div className="flex items-baseline justify-between gap-3">
        <div className="font-serif text-[1.2rem] text-[var(--color-gold)]">{money(c.soldPrice)}</div>
        {c.soldDate && <div className="font-sans text-[0.74rem] text-[var(--color-muted)]">Sold {fmtShortDate(c.soldDate)}</div>}
      </div>
      <div className="mt-1 font-sans text-[0.9rem] font-medium text-[var(--color-ink)]">{c.address}</div>
      <div className="mt-0.5 font-sans text-[0.78rem] text-[var(--color-muted)]">
        {c.beds > 0 ? `${c.beds} bd · ` : ""}
        {c.sqft.toLocaleString()} sqft · {money(c.ppsf)}/sqft
      </div>
      {bullets.length > 0 && (
        <div className="mt-3 space-y-1">
          {bullets.map((b, i) => (
            <div key={i} className={`flex items-center gap-1.5 font-sans text-[0.78rem] ${b.up ? "text-[#2e7d5b]" : "text-[#b4433a]"}`}>
              <span>{b.up ? "▲" : "▼"}</span>
              <span>{b.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- main ---------- */

type LeadKind = "list" | "cash" | "valuation" | "financing" | "buying";
type Status = "idle" | "sending" | "ok" | "error";

export function HomeownerDashboard(p: DashboardProps) {
  const [status, setStatus] = useState<Record<LeadKind, Status>>({
    list: "idle",
    cash: "idle",
    valuation: "idle",
    financing: "idle",
    buying: "idle",
  });

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

  const fullAddress = `${p.address}, ${p.city}, ${p.state} ${p.zip}`;

  async function submitLead(kind: LeadKind, type: string, tags: string[], message: string) {
    setStatus((s) => ({ ...s, [kind]: "sending" }));
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: p.firstName,
          lastName: p.lastName,
          email: p.email,
          phone: p.phone,
          address: fullAddress,
          type,
          source: "Homeowner Dashboard",
          tags,
          message,
        }),
      });
      const json = await res.json().catch(() => ({ ok: false }));
      setStatus((s) => ({ ...s, [kind]: res.ok && json.ok ? "ok" : "error" }));
    } catch {
      setStatus((s) => ({ ...s, [kind]: "error" }));
    }
  }

  const cta = (kind: LeadKind, label: string, onClick: () => void, variant: "solid" | "ghost" = "solid") => {
    const st = status[kind];
    if (st === "ok")
      return <span className="font-sans text-[0.9rem] font-semibold text-[#2e7d5b]">✓ Sent — we&apos;ll reach out shortly.</span>;
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={st === "sending"}
        className={`${variant === "solid" ? "btn" : "btn btn-ghost"} disabled:opacity-60`}
      >
        {st === "sending" ? "Sending…" : label}
      </button>
    );
  };

  const up = p.appreciation && p.appreciation.abs >= 0;
  const rangeLabel = p.low && p.high ? `${money(p.low)} – ${money(p.high)}` : money(p.currentValue);
  const videoId = p.buyingVideoId;
  const hasRates = !!(p.rates && p.rates.series.length > 1);
  const hasReviews = !!(p.reviews && (p.reviews.reviews.length > 0 || p.reviews.total > 0));

  const navItems: { id: string; label: string }[] = [
    { id: "selling", label: "Selling Options" },
    { id: "value", label: "Market Value" },
    ...(videoId ? [{ id: "buying", label: "Buying a Home" }] : []),
    ...(hasReviews ? [{ id: "reviews", label: "Contact Agent / Reviews" }] : []),
    { id: "equity", label: "Home Equity Calculator" },
    { id: "financing", label: "Learn About Financing" },
    ...(hasRates ? [{ id: "rates", label: "Mortgage Rate Trends" }] : []),
    ...(p.comps && p.comps.length > 0 ? [{ id: "sales", label: "Recent Home Sales" }] : []),
    { id: "details", label: "Home Details" },
  ];

  const facts = useMemo(
    () =>
      [
        p.beds ? { label: "Bedrooms", value: p.beds } : null,
        p.baths ? { label: "Bathrooms", value: p.baths } : null,
        p.sqft ? { label: "Sqft.", value: p.sqft.toLocaleString() } : null,
      ].filter(Boolean) as { label: string; value: string | number }[],
    [p.beds, p.baths, p.sqft]
  );

  return (
    <div className="min-h-screen bg-[var(--color-cream,#f6f3ec)]">
      {/* Top bar */}
      <div className="border-b border-[var(--color-line)] bg-white">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-6 py-4">
          <div className="font-serif text-[1.15rem] font-semibold tracking-tight text-[var(--color-ink)]">
            {homeownerBrand.name}
          </div>
          <div className="font-sans text-[0.8rem] text-[var(--color-muted)]">{fullAddress}</div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-[210px_1fr_260px]">
        {/* Left nav */}
        <aside className="hidden lg:block">
          <div className="sticky top-6">
            <div className="font-serif text-[1.3rem] text-[var(--color-ink)]">Welcome home!</div>
            <nav className="mt-5 flex flex-col gap-3">
              {navItems.map((n) => (
                <a
                  key={n.id}
                  href={`#${n.id}`}
                  className="font-sans text-[0.92rem] text-[var(--color-ink-soft)] no-underline hover:text-[var(--color-gold)]"
                >
                  {n.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Center modules */}
        <main className="flex flex-col gap-6">
          {/* Facts + greeting */}
          <div className="rounded-[16px] border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-soft)] md:p-8">
            <div className="font-sans text-[0.72rem] uppercase tracking-[0.16em] text-[var(--color-gold)]">
              {homeownerBrand.name} · Home Value Report
            </div>
            <h1 className="mt-2 font-serif text-[1.9rem] leading-tight text-[var(--color-ink)]">
              Hi {p.firstName || "there"}, welcome to your home dashboard
            </h1>
            {facts.length > 0 && (
              <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {facts.map((f) => (
                  <Fact key={f.label} label={f.label} value={f.value} />
                ))}
              </div>
            )}
            <div className="mt-5">
              <button
                type="button"
                onClick={() =>
                  submitLead("valuation", "Seller Inquiry", ["Homeowner Dashboard", "Update Home Facts"], `Wants to update home facts to improve the estimate for ${fullAddress}.`)
                }
                className="font-sans text-[0.9rem] font-semibold text-[var(--color-gold)] underline-offset-2 hover:underline"
              >
                {status.valuation === "ok" ? "Thanks — we'll be in touch." : "Edit home facts to improve your estimate →"}
              </button>
            </div>
          </div>

          {/* Selling options */}
          <Module id="selling" title="Interested in selling?" subtitle="Two ways to move — list on the open market, or take a cash offer.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[12px] border border-[var(--color-line)] p-5">
                <div className="font-serif text-[1.15rem] text-[var(--color-ink)]">List your home with us</div>
                <div className="mt-1 font-sans text-[0.85rem] text-[var(--color-ink-soft)]">
                  Estimated sale range
                </div>
                <div className="mt-0.5 font-serif text-[1.4rem] text-[var(--color-gold)]">{rangeLabel}</div>
                <div className="mt-4">
                  {cta("list", "List Your Home With Us", () =>
                    submitLead("list", "Seller Inquiry", ["Seller Lead", "Homeowner Dashboard", "List With Us"], `Interested in listing ${fullAddress}. Automated estimate: ${money(p.currentValue)}.`)
                  )}
                </div>
              </div>
              <div className="rounded-[12px] border border-[var(--color-line)] p-5">
                <div className="font-serif text-[1.15rem] text-[var(--color-ink)]">Sell your home for cash</div>
                <div className="mt-1 font-sans text-[0.85rem] text-[var(--color-ink-soft)]">
                  A no-obligation cash offer, plus what it could bring on the open market — side by side.
                </div>
                <div className="mt-4">
                  {cta("cash", "Get My Offer", () =>
                    submitLead("cash", "Cash Offer Request", ["Seller Lead", "Homeowner Dashboard", "Cash Offer"], `Requested a cash offer for ${fullAddress}. Automated estimate: ${money(p.currentValue)}.`)
                  )}
                </div>
              </div>
            </div>
          </Module>

          {/* Market value */}
          <Module id="value" title="Your home estimate" subtitle={`As of ${fmtDate(p.asOf)}`}>
            <div className="font-sans text-[0.72rem] uppercase tracking-[0.14em] text-[var(--color-muted)]">
              Estimated value
            </div>
            <div className="mt-1 font-serif text-[3rem] leading-none text-[var(--color-gold)] md:text-[3.4rem]">
              {money(p.currentValue)}
            </div>
            {p.low && p.high && (
              <div className="mt-2 font-sans text-[0.95rem] text-[var(--color-ink-soft)]">
                Likely range {money(p.low)} – {money(p.high)}
              </div>
            )}
            {p.appreciation && (
              <div
                className={`mt-4 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 font-sans text-[0.85rem] font-semibold ${
                  up ? "bg-[var(--color-gold)]/12 text-[var(--color-gold)]" : "bg-[#b4433a]/10 text-[#b4433a]"
                }`}
              >
                {up ? "▲" : "▼"} {money(Math.abs(p.appreciation.abs))} ({p.appreciation.pct >= 0 ? "+" : "−"}
                {Math.abs(p.appreciation.pct).toFixed(1)}%) since we started tracking
              </div>
            )}
            <TrendChart series={p.series} />
            <div className="mt-5 border-t border-[var(--color-line)] pt-5">
              <p className="font-sans text-[0.85rem] text-[var(--color-ink-soft)]">
                This is an automated estimate from Nevada MLS comparables. For a precise figure, get a professional
                valuation.
              </p>
              <div className="mt-3">
                {cta("valuation", "Get a Professional Valuation", () =>
                  submitLead("valuation", "Seller Inquiry", ["Seller Lead", "Homeowner Dashboard", "Requested CMA"], `Requested a professional valuation for ${fullAddress}. Automated estimate: ${money(p.currentValue)}.`)
                )}
              </div>
            </div>
          </Module>

          {/* Buying a home */}
          {videoId && (
            <Module id="buying" title="Buying a home" subtitle="A quick guide to what the process looks like.">
              <div className="relative w-full overflow-hidden rounded-[12px]" style={{ paddingTop: "56.25%" }}>
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="Buying a home"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="mt-4">
                {cta("buying", "I'm thinking about buying", () =>
                  submitLead("buying", "Buyer Inquiry", ["Buyer Lead", "Homeowner Dashboard"], `Interested in buying — currently at ${fullAddress}.`)
                )}
              </div>
            </Module>
          )}

          {/* Contact agent / Google reviews */}
          {hasReviews && p.reviews && (
            <Module id="reviews" title="Contact your agent" subtitle="Backed by real reviews from clients across the valley.">
              <div className="flex flex-wrap items-center gap-3">
                <div className="font-serif text-[2rem] leading-none text-[var(--color-ink)]">
                  {p.reviews.rating.toFixed(1)}
                </div>
                <div>
                  <Stars rating={p.reviews.rating} />
                  <div className="font-sans text-[0.78rem] text-[var(--color-muted)]">
                    {p.reviews.total.toLocaleString()} Google review{p.reviews.total === 1 ? "" : "s"}
                  </div>
                </div>
              </div>
              {p.reviews.reviews.length > 0 && (
                <div className="mt-5 space-y-4">
                  {p.reviews.reviews.map((r, i) => (
                    <div key={i} className="border-t border-[var(--color-line)] pt-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-sans text-[0.88rem] font-semibold text-[var(--color-ink)]">{r.author}</span>
                        <span className="font-sans text-[0.72rem] text-[var(--color-muted)]">{r.when}</span>
                      </div>
                      <div className="mt-0.5 text-[0.82rem]">
                        <Stars rating={r.rating} />
                      </div>
                      <p className="mt-1.5 font-sans text-[0.85rem] leading-relaxed text-[var(--color-ink-soft)]">
                        “{r.text}”
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[var(--color-line)] pt-4">
                <a href={`tel:${homeownerBrand.phone}`} className="btn">
                  Call {homeownerBrand.phone}
                </a>
                {p.reviews.url && (
                  <a href={p.reviews.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                    See all reviews on Google
                  </a>
                )}
              </div>
            </Module>
          )}

          {/* Home equity calculator */}
          <Module id="equity" title="Home equity calculator" subtitle="See your estimated equity — adjust the numbers to fit your situation.">
            <EquityCalculator estimate={p.currentValue} />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-line)] pt-4">
              <span className="font-sans text-[0.9rem] text-[var(--color-ink-soft)]">
                How much could you make selling your home?
              </span>
              {cta(
                "list",
                "Contact Agent",
                () => submitLead("list", "Seller Inquiry", ["Seller Lead", "Homeowner Dashboard", "Equity Calculator"], `Used the equity calculator on ${fullAddress} and wants to learn more.`),
                "ghost"
              )}
            </div>
          </Module>

          {/* Financing */}
          <Module id="financing" title="Learn about financing" subtitle="Refinance, cash out, or finance your next home.">
            <p className="font-sans text-[0.9rem] text-[var(--color-ink-soft)]">
              Whether you&apos;re weighing a refinance or planning your next purchase, {homeownerBrand.name} can connect
              you with a trusted local lender for personalized guidance — no obligation.
            </p>
            <div className="mt-4">
              {cta("financing", "Ask About Financing", () =>
                submitLead("financing", "Financing Inquiry", ["Homeowner Dashboard", "Financing"], `Has questions about financing / refinancing (${fullAddress}).`)
              )}
            </div>
          </Module>

          {/* Mortgage rate trends (live from FRED when configured) */}
          {hasRates && p.rates && (
            <Module id="rates" title="Mortgage rate trends" subtitle="Average U.S. mortgage rates, updated weekly.">
              <div className="flex flex-wrap gap-8">
                {p.rates.current.r30 != null && (
                  <div>
                    <div className="font-serif text-[2.2rem] leading-none text-[var(--color-ink)]">
                      {p.rates.current.r30.toFixed(2)}
                      <span className="text-[1.1rem]">%</span>
                    </div>
                    <div className="mt-1 font-sans text-[0.78rem] text-[var(--color-muted)]">30-year fixed</div>
                  </div>
                )}
                {p.rates.current.r15 != null && (
                  <div>
                    <div className="font-serif text-[2.2rem] leading-none text-[var(--color-ink)]">
                      {p.rates.current.r15.toFixed(2)}
                      <span className="text-[1.1rem]">%</span>
                    </div>
                    <div className="mt-1 font-sans text-[0.78rem] text-[var(--color-muted)]">15-year fixed</div>
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center gap-5 font-sans text-[0.75rem] text-[var(--color-muted)]">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-[3px] w-5 rounded bg-[var(--color-gold)]" /> 30-year fixed
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-[3px] w-5 rounded bg-[var(--color-graphite)]" /> 15-year fixed
                </span>
              </div>
              <RateChart rates={p.rates} />
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-line)] pt-4">
                <span className="font-sans text-[0.9rem] text-[var(--color-ink-soft)]">
                  Ready to explore refinancing, a cash-out, or your next home?
                </span>
                {cta("financing", "Contact Us", () =>
                  submitLead("financing", "Financing Inquiry", ["Homeowner Dashboard", "Financing", "Rate Trends"], `Interested in financing options (rate trends) — ${fullAddress}.`)
                )}
              </div>
              <p className="mt-3 font-sans text-[0.7rem] text-[var(--color-muted)]">
                Source: Freddie Mac via FRED. Rates are national averages, not a quote.
              </p>
            </Module>
          )}

          {/* Recent home sales */}
          {p.comps && p.comps.length > 0 && (
            <Module id="sales" title="Recent home sales" subtitle="See how your home measures up to nearby sales.">
              {p.mapUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.mapUrl}
                  alt="Map of your home (H) and recent nearby sales"
                  className="mb-4 w-full rounded-[12px] border border-[var(--color-line)]"
                  loading="lazy"
                />
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                {p.comps.map((c, i) => (
                  <CompCard key={i} c={c} subjectBeds={p.beds} subjectSqft={p.sqft} />
                ))}
              </div>
              <p className="mt-4 font-sans text-[0.72rem] text-[var(--color-muted)]">
                Sold comparables near your home from the past six months (Nevada MLS). See missing home sales?{" "}
                <a href={`tel:${homeownerBrand.phone}`} className="text-[var(--color-gold)] no-underline">
                  Contact us
                </a>
                .
              </p>
            </Module>
          )}

          {/* Local market snapshot (kept — extra context Fello shows via comps) */}
          {p.market && (
            <Module id="market" title="Your local market" subtitle={`Active listings in ${p.market.zip}`}>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <div className="font-serif text-[1.6rem] text-[var(--color-ink)]">{p.market.activeCount}</div>
                  <div className="font-sans text-[0.76rem] text-[var(--color-muted)]">Homes for sale now</div>
                </div>
                <div>
                  <div className="font-serif text-[1.6rem] text-[var(--color-ink)]">{money(p.market.medianList)}</div>
                  <div className="font-sans text-[0.76rem] text-[var(--color-muted)]">Median list price</div>
                </div>
                <div>
                  <div className="font-serif text-[1.6rem] text-[var(--color-ink)]">{p.market.medianDom}</div>
                  <div className="font-sans text-[0.76rem] text-[var(--color-muted)]">Median days on market</div>
                </div>
              </div>
            </Module>
          )}

          {/* Home details */}
          <Module id="details" title="Home details" subtitle="Confirm these details are up to date for the most accurate valuation.">
            {facts.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {facts.map((f) => (
                  <Fact key={f.label} label={f.label} value={f.value} />
                ))}
              </div>
            ) : (
              <p className="font-sans text-[0.9rem] text-[var(--color-ink-soft)]">
                We&apos;ll confirm your home&apos;s details when we prepare your full report.
              </p>
            )}
            <div className="mt-4">
              {cta(
                "valuation",
                "These details need updating",
                () => submitLead("valuation", "Seller Inquiry", ["Homeowner Dashboard", "Update Home Facts"], `Wants to correct home details for ${fullAddress}.`),
                "ghost"
              )}
            </div>
          </Module>

          <p className="text-center font-sans text-[0.72rem] leading-relaxed text-[var(--color-muted)]">
            {homeownerBrand.legalName} · Automated estimates use available market data and are not an appraisal or a
            guarantee of value. Equal Housing Opportunity.
          </p>
        </main>

        {/* Right contact card */}
        <aside className="lg:block">
          <div className="sticky top-6 rounded-[16px] border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-soft)]">
            <div className="font-sans text-[0.72rem] uppercase tracking-[0.16em] text-[var(--color-muted)]">
              Need help? Contact us
            </div>
            <div className="mt-3 font-serif text-[1.15rem] text-[var(--color-ink)]">{homeownerBrand.name}</div>
            <div className="font-sans text-[0.85rem] text-[var(--color-ink-soft)]">{homeownerBrand.brokerage}</div>
            <a
              href={`mailto:${homeownerBrand.email}`}
              className="mt-1 block font-sans text-[0.85rem] text-[var(--color-gold)] no-underline"
            >
              {homeownerBrand.email}
            </a>
            <a href={`tel:${homeownerBrand.phone}`} className="mt-4 block w-full">
              <span className="btn w-full justify-center text-center">Contact</span>
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
