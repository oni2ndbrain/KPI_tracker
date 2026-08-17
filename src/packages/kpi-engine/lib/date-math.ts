const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Raw (fractional) days from one ISO date/timestamp to another — positive when `toIso` is
 * later. Callers round or floor per their own semantics (a checkpoint match vs. a threshold). */
export function daysBetween(fromIso: string, toIso: string): number {
  return (new Date(toIso).getTime() - new Date(fromIso).getTime()) / MS_PER_DAY;
}

/** Rounded whole days from `today` to `targetIso` — the shared "D-day" rounding rule for
 * anywhere a deadline needs to render as a single day count (e.g. "D-18"). */
export function daysUntil(today: string, targetIso: string): number {
  return Math.round(daysBetween(today, targetIso));
}
