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
