/**
 * Offer Machine — date rules for the default close of escrow: 30 days out, moved forward to the next
 * Tuesday, Wednesday or Thursday that is not a holiday (the team's standard, per the transaction
 * coordinator). Pure; dates are YYYY-MM-DD in Las Vegas time.
 */
const utc = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
const fmt = (d: Date) => d.toISOString().slice(0, 10);

export function plusDays(ymd: string, days: number): string {
  const d = utc(ymd);
  d.setUTCDate(d.getUTCDate() + days);
  return fmt(d);
}

/** The nth (1-based) given weekday (0=Sun) of a month; n = -1 means the last one. */
function nthWeekday(year: number, month: number, weekday: number, n: number): string {
  if (n > 0) {
    const first = new Date(Date.UTC(year, month - 1, 1));
    const offset = (weekday - first.getUTCDay() + 7) % 7;
    return fmt(new Date(Date.UTC(year, month - 1, 1 + offset + (n - 1) * 7)));
  }
  const last = new Date(Date.UTC(year, month, 0));
  const back = (last.getUTCDay() - weekday + 7) % 7;
  return fmt(new Date(Date.UTC(year, month - 1, last.getUTCDate() - back)));
}

/** A fixed-date holiday, observed on the Friday before (if Saturday) or the Monday after (if Sunday). */
function observed(year: number, month: number, day: number): string[] {
  const d = new Date(Date.UTC(year, month - 1, day));
  const out = [fmt(d)];
  if (d.getUTCDay() === 6) out.push(plusDays(fmt(d), -1));
  if (d.getUTCDay() === 0) out.push(plusDays(fmt(d), 1));
  return out;
}

/** Days title/escrow offices and lenders are closed: federal holidays plus Nevada Day and Family Day. */
export function holidaysFor(year: number): Set<string> {
  const thanksgiving = nthWeekday(year, 11, 4, 4);
  return new Set([
    ...observed(year, 1, 1),
    nthWeekday(year, 1, 1, 3), // MLK Day
    nthWeekday(year, 2, 1, 3), // Presidents Day
    nthWeekday(year, 5, 1, -1), // Memorial Day
    ...observed(year, 6, 19),
    ...observed(year, 7, 4),
    nthWeekday(year, 9, 1, 1), // Labor Day
    nthWeekday(year, 10, 1, 2), // Columbus / Indigenous Peoples' Day
    nthWeekday(year, 10, 5, -1), // Nevada Day (last Friday of October)
    ...observed(year, 11, 11),
    thanksgiving,
    plusDays(thanksgiving, 1), // Family Day
    ...observed(year, 12, 25),
  ]);
}

export function isHoliday(ymd: string): boolean {
  return holidaysFor(Number(ymd.slice(0, 4))).has(ymd);
}

/** `days` after today, moved forward to the next Tue/Wed/Thu that isn't a holiday. */
export function standardCloseDate(today: string, days: number): string {
  let d = plusDays(today, days);
  for (let i = 0; i < 14; i++) {
    const dow = utc(d).getUTCDay();
    if (dow >= 2 && dow <= 4 && !isHoliday(d)) return d;
    d = plusDays(d, 1);
  }
  return d;
}
