import type { CalendarEvent, CreateEventInput } from "../../calendar/index.js";
import type { ApplicationPeriod } from "../../kpi-engine/index.js";

/** Tags calendar events this system writes itself (currently just the deadline event), so a
 * later read of the calendar can tell them apart from entries the user typed in by hand. */
export const DEADLINE_EVENT_MARKER = "kpi-tracker:deadline";

function nextDay(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

/** Builds the all-day calendar event written when a target company's deadline is extracted from
 * its JD. The end date is the day after the deadline, per Google Calendar's exclusive-end
 * convention for all-day events. */
export function buildDeadlineEvent(company: { name: string; deadline: string }): CreateEventInput {
  return {
    title: `${company.name} 지원 마감일`,
    start: company.deadline,
    end: nextDay(company.deadline),
    description: DEADLINE_EVENT_MARKER,
  };
}

/** Matches calendar events the user entered by hand — i.e. everything except this system's own
 * deadline events — against target companies by name, returning each match's application
 * period. A company with no matching calendar entry is simply absent from the result. */
export function matchApplicationPeriods(
  events: CalendarEvent[],
  companies: { id: string; name: string }[],
): Map<string, ApplicationPeriod> {
  const userEvents = events.filter((event) => event.description !== DEADLINE_EVENT_MARKER);
  const result = new Map<string, ApplicationPeriod>();

  for (const company of companies) {
    const match = userEvents.find((event) => event.title.includes(company.name));
    if (match) result.set(company.id, { start: match.start, end: match.end });
  }

  return result;
}
