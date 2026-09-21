import Link from "next/link";
import type { ReactNode } from "react";

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${className}`}>
      {children}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface shadow-[0_1px_2px_rgba(20,24,31,0.04)] ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  children,
  hint,
}: {
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4">
      <h2 className="text-sm font-semibold tracking-wide text-ink-muted uppercase">
        {children}
      </h2>
      {hint ? <span className="text-xs text-ink-subtle">{hint}</span> : null}
    </div>
  );
}

type RiskLevel = "info" | "warn" | "critical" | null;

export function RiskPill({
  level,
  score,
}: {
  level: RiskLevel;
  score?: number;
}) {
  const styles: Record<string, string> = {
    critical: "bg-risk-critical-soft text-risk-critical",
    warn: "bg-risk-warn-soft text-risk-warn",
    info: "bg-risk-ok-soft text-risk-ok",
  };
  const labels: Record<string, string> = {
    critical: "At risk",
    warn: "Watch",
    info: "On track",
  };
  const key = level ?? "info";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${styles[key]}`}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {labels[key]}
      {typeof score === "number" ? (
        <span className="numeric font-normal opacity-70">{score}</span>
      ) : null}
    </span>
  );
}

export function ProgressBar({
  done,
  total,
  level,
}: {
  done: number;
  total: number;
  level?: RiskLevel;
}) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const barColor =
    level === "critical"
      ? "bg-risk-critical"
      : level === "warn"
        ? "bg-risk-warn"
        : "bg-brand";
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${done} of ${total} milestones complete`}
      >
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="numeric shrink-0 text-xs text-ink-muted">
        {done}/{total}
      </span>
    </div>
  );
}

/** Marks a date the system derived rather than read off the contract. */
export function SourceTag({ source }: { source: string | null }) {
  if (!source) return null;
  const isComputed = source === "computed";
  return (
    <span
      title={
        isComputed
          ? "Derived from the contract's dates — not a term read off the document"
          : "Read from the signed contract"
      }
      className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
        isComputed
          ? "bg-surface-sunken text-ink-subtle"
          : "bg-brand-soft text-brand"
      }`}
    >
      {source}
    </span>
  );
}

export function NavLink({
  href,
  children,
  active,
}: {
  // typedRoutes is on, so borrow Link's own href type rather than widening to string.
  href: React.ComponentProps<typeof Link>["href"];
  children: ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-brand-soft text-brand"
          : "text-ink-muted hover:bg-surface-sunken hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

export function formatMoney(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "—";
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}
