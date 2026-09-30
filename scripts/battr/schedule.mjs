/**
 * Day filters — which weekdays an action is allowed to fire on.
 *
 * This is not cosmetic. The live sweep action runs on "Weekdays Excluding
 * Monday", and that is visible in the audit history: across 33 observed runs,
 * every run that swept fell on Tue/Wed/Thu/Fri and every Sat/Sun/Mon run left
 * notes but swept nothing. Monday is excluded so the weekend's backlog gets a
 * working day of agent attention before anything is taken away.
 *
 * A blocked day must log a SKIP, never silently drop the action.
 */

/**
 * The evening a run BELONGS to, as opposed to the moment it started.
 *
 * The audit is scheduled for 7 PM Pacific, matching Battr. GitHub starts
 * scheduled runs late — on this repo, 5 to 6 hours late every night (runs
 * #42-#45 started between 11:52 PM and 1:00 AM PT). Read off the wall clock,
 * Monday night's run believes it is Tuesday: "Weekdays Excluding Monday" then
 * sweeps Mon-Thu nights where Battr sweeps Tue-Fri, and every At Risk Since
 * stamp lands a day later than Battr's would.
 *
 * Stepping back seven hours maps any start between 7 PM and 7 AM onto the
 * evening it was meant for, and leaves a daytime manual run on its own day.
 */
export const AUDIT_DAY_OFFSET_HOURS = 7;

export function auditDate(now = new Date()) {
  return new Date(now.getTime() - AUDIT_DAY_OFFSET_HOURS * 3_600_000);
}

/** Pacific time minus UTC at a given instant, in ms (handles DST). */
function ptOffsetMs(at, timeZone = "America/Los_Angeles") {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(at);
  const v = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const wall = Date.UTC(+v.year, +v.month - 1, +v.day, +v.hour, +v.minute, +v.second);
  return wall - Math.floor(at.getTime() / 1000) * 1000;
}

/**
 * The INSTANT a run is judged at — 7 PM Pacific on its evening, not whenever
 * GitHub got round to starting it.
 *
 * With days now counted exactly ("more than 33 days" means 33.0001), the hour
 * matters. Battr judges at about 7 PM PT; we start 5-6 hours later, so every
 * lead sitting inside that gap reads a quarter-day older here than it did to
 * Battr and is flagged a night early. Judging at 7 PM removes the skew.
 *
 * Activity that arrives after 7 PM is still read (it makes a lead MORE
 * compliant, never less). A daytime manual run, which has no 7 PM to align to,
 * is judged at the moment it starts.
 */
export function auditInstant(now = new Date(), timeZone = "America/Los_Angeles") {
  const evening = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(auditDate(now));
  const [y, m, d] = evening.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d, 19, 0, 0);
  const instant = guess - ptOffsetMs(new Date(guess), timeZone);
  return new Date(Math.min(instant, now.getTime()));
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Weekday name in the team's timezone, not the server's. */
export function weekdayIn(date, timeZone = "America/Los_Angeles") {
  return new Intl.DateTimeFormat("en-US", { timeZone, weekday: "long" }).format(date);
}

export const DAY_FILTERS = {
  "Every Day": DAYS,
  Weekdays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "Weekdays Excluding Monday": ["Tuesday", "Wednesday", "Thursday", "Friday"],
  Weekends: ["Saturday", "Sunday"],
};

/**
 * Is `dayFilter` satisfied today? Accepts a named filter or an explicit list of
 * day names. An unrecognized filter fails closed — better a logged skip than an
 * unintended sweep.
 */
export function isDayAllowed(dayFilter, date = new Date(), timeZone = "America/Los_Angeles") {
  if (!dayFilter) return true;
  const today = weekdayIn(date, timeZone);

  if (Array.isArray(dayFilter)) return dayFilter.includes(today);

  const allowed = DAY_FILTERS[dayFilter];
  if (!allowed) return false;
  return allowed.includes(today);
}
