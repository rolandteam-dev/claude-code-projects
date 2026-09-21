/**
 * Calendar-date arithmetic on `yyyy-mm-dd` strings.
 *
 * Contract deadlines are days, not instants. Doing this math with local `Date`
 * objects is how deadlines end up one day off for half the users, so everything
 * here parses to UTC midnight, does integer day math, and formats back to a
 * string. No timezone ever enters the calculation.
 */

export type IsoDate = string; // yyyy-mm-dd

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): value is IsoDate {
  return ISO_RE.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function toUtc(date: IsoDate): number {
  if (!isIsoDate(date)) {
    throw new Error(`Not an ISO calendar date: ${date}`);
  }
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUtc(ms: number): IsoDate {
  return new Date(ms).toISOString().slice(0, 10);
}

const DAY_MS = 86_400_000;

export function addDays(date: IsoDate, days: number): IsoDate {
  return fromUtc(toUtc(date) + days * DAY_MS);
}

export function diffDays(from: IsoDate, to: IsoDate): number {
  return Math.round((toUtc(to) - toUtc(from)) / DAY_MS);
}

/** 0 = Sunday. */
export function dayOfWeek(date: IsoDate): number {
  return new Date(toUtc(date)).getUTCDay();
}

export function isWeekend(date: IsoDate): boolean {
  const d = dayOfWeek(date);
  return d === 0 || d === 6;
}

/**
 * Adds business days, skipping weekends.
 *
 * NOTE: federal/state holidays are NOT handled yet — that is part of open
 * question #3 (NVAR day-counting rules). Until those rules are confirmed, a
 * deadline landing on a holiday will be one day optimistic.
 */
export function addBusinessDays(date: IsoDate, days: number): IsoDate {
  let remaining = Math.abs(days);
  const step = days < 0 ? -1 : 1;
  let cursor = date;
  while (remaining > 0) {
    cursor = addDays(cursor, step);
    if (!isWeekend(cursor)) remaining -= 1;
  }
  return cursor;
}

/** Rolls forward off a weekend. Holidays: see the note above. */
export function rollForwardOffWeekend(date: IsoDate): IsoDate {
  let cursor = date;
  while (isWeekend(cursor)) cursor = addDays(cursor, 1);
  return cursor;
}

export function today(): IsoDate {
  return new Date().toISOString().slice(0, 10);
}

export function formatIso(date: IsoDate | null | undefined): string {
  if (!date) return "—";
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
