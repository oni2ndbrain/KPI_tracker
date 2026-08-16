export interface CreateEventInput {
  title: string;
  /** ISO date (YYYY-MM-DD) — all-day event start. */
  start: string;
  /** ISO date (YYYY-MM-DD) — all-day event end, exclusive per Google Calendar's convention
   * (a one-day event on 2026-09-30 has start "2026-09-30" and end "2026-10-01"). */
  end: string;
  /** Not shown to the user in the calendar UI's main view; used to tag events this system wrote
   * itself, so a later read can tell them apart from events the user entered by hand. */
  description?: string;
}

export interface CalendarEvent extends CreateEventInput {
  id: string;
}

/** The narrow surface the calendar adapter depends on. Production code talks to real Google
 * Calendar through an implementation of this; tests use an in-memory fake — neither ever calls
 * the real API in a test run. Only all-day (date-only) events are represented — timed events are
 * filtered out by the real implementation before they ever reach this interface. */
export interface CalendarClient {
  createEvent(event: CreateEventInput): Promise<CalendarEvent>;
  listEvents(): Promise<CalendarEvent[]>;
}
