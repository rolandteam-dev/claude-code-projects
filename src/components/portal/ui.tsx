"use client";

import type { ReactNode } from "react";

/** Shared portal primitives — keeps the six portal screens visually identical. */

export const fieldClass =
  "w-full rounded-md border border-[var(--color-line)] bg-white px-4 py-3 font-sans text-[0.95rem] text-[var(--color-ink)] focus:border-[var(--color-gold)] focus:outline-none";

export const labelClass = "font-sans text-[0.68rem] uppercase tracking-[0.1em] text-[var(--color-muted)]";

export function money(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[14px] border border-[var(--color-line)] bg-white p-6 ${className}`}>{children}</div>
  );
}

export function CardTitle({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <h2 className="font-sans text-[1.02rem] font-semibold text-[var(--color-ink)]">{children}</h2>
      {hint && <span className="font-sans text-[0.72rem] text-[var(--color-muted)]">{hint}</span>}
    </div>
  );
}

/** Circular progress indicator used on the dashboard and journey pages. */
export function ProgressRing({
  value,
  total,
  size = 76,
}: {
  value: number;
  total: number;
  size?: number;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-sand-deep)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-gold)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-sans text-[0.85rem] font-semibold text-[var(--color-ink)]">
        {pct}%
      </div>
      <span className="sr-only">
        {value} of {total} steps complete
      </span>
    </div>
  );
}

export function Pill({ children, tone = "sand" }: { children: ReactNode; tone?: "sand" | "gold" | "quiet" }) {
  const tones = {
    sand: "bg-[var(--color-sand)] text-[var(--color-ink-soft)]",
    gold: "bg-[var(--color-gold)] text-white",
    quiet: "border border-[var(--color-line)] text-[var(--color-muted)]",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 font-sans text-[0.66rem] font-semibold uppercase tracking-[0.1em] ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-[14px] border border-dashed border-[var(--color-line)] bg-[var(--color-sand)] p-8 text-center">
      <div className="font-sans text-[0.98rem] font-semibold text-[var(--color-ink)]">{title}</div>
      {children && <div className="mx-auto mt-2 max-w-[46ch] font-sans text-[0.88rem] text-[var(--color-ink-soft)]">{children}</div>}
    </div>
  );
}

export function CheckIcon({ done }: { done: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={[
        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
        done ? "border-[var(--color-gold)] bg-[var(--color-gold)] text-white" : "border-[var(--color-line)] bg-white",
      ].join(" ")}
    >
      {done && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </span>
  );
}
