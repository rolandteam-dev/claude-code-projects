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
