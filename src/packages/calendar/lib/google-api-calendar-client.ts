import { calendar } from "@googleapis/calendar";
import type { CalendarClient, CalendarEvent, CreateEventInput } from "./calendar-client.js";
import type { OAuth2Client } from "./env-auth.js";

const PRIMARY_CALENDAR_ID = "primary";

/** The shape of an outgoing events.insert request body — deliberately its own local type rather
 * than the googleapis-generated calendar_v3.Schema$Event, so this package's public contract
 * (index.ts, which these are exported through for contract testing) doesn't leak a third-party
 * SDK type. Structurally compatible with Schema$Event, so it can be passed anywhere Google's own
 * client expects one. */
export interface CalendarEventRequestBody {
  summary?: string;
  description?: string;
  start?: { date?: string };
  end?: { date?: string };
}

/** The subset of an incoming Calendar API response (events.insert's or one item of
 * events.list's) these transforms read — permissive about null since that's how Google's own
 * generated types (and raw JSON) represent an explicitly-absent field. A real
 * calendar_v3.Schema$Event is structurally compatible and can be passed wherever this is expected. */
export interface RawCalendarEventPayload {
  id?: string | null;
  summary?: string | null;
  description?: string | null;
  start?: { date?: string | null } | null;
  end?: { date?: string | null } | null;
}

export interface RawCalendarEventListPayload {
  items?: RawCalendarEventPayload[] | null;
}

/** Builds the request body for creating an all-day event. Exported (and covered by a recorded
 * fixture test) separately from createGoogleApiCalendarClient so the request shape can be
 * verified without ever calling the real API. */
export function toEventRequestBody(event: CreateEventInput): CalendarEventRequestBody {
  return {
    summary: event.title,
    description: event.description,
    start: { date: event.start },
    end: { date: event.end },
  };
}

/** Turns the raw response from events.insert into a CalendarEvent. Throws if Google didn't
 * return an id — every other field falls back to what was sent, since Calendar sometimes omits
 * unset fields from the created-event response rather than echoing them back. */
export function parseCreatedEvent(raw: RawCalendarEventPayload, sent: CreateEventInput): CalendarEvent {
  if (!raw.id) throw new Error("Calendar did not return an id for the created event");
  return {
    id: raw.id,
    title: raw.summary ?? sent.title,
    start: raw.start?.date ?? sent.start,
    end: raw.end?.date ?? sent.end,
    description: raw.description ?? sent.description,
  };
}

/** Turns the raw response from events.list into CalendarEvents, keeping only all-day (date-only)
 * events with an id — timed events (start.dateTime instead of start.date) are out of scope,
 * since every deadline and application-period entry this system cares about is a whole-day date. */
export function parseEventList(raw: RawCalendarEventListPayload): CalendarEvent[] {
  const items = raw.items ?? [];
  const events: CalendarEvent[] = [];

  for (const item of items) {
    if (!item.id || !item.start?.date || !item.end?.date) continue;
    events.push({
      id: item.id,
      title: item.summary ?? "",
      start: item.start.date,
      end: item.end.date,
      description: item.description ?? undefined,
    });
  }

  return events;
}

/** Real Google Calendar-backed implementation of CalendarClient. Never used in tests — see
 * tests/fakes/. Always reads/writes the user's primary calendar. */
export function createGoogleApiCalendarClient(auth: OAuth2Client): CalendarClient {
  const client = calendar({ version: "v3", auth });

  return {
    async createEvent(event) {
      const response = await client.events.insert({
        calendarId: PRIMARY_CALENDAR_ID,
        requestBody: toEventRequestBody(event),
      });
      return parseCreatedEvent(response.data, event);
    },

    async listEvents() {
      const response = await client.events.list({
        calendarId: PRIMARY_CALENDAR_ID,
        singleEvents: true,
      });
      return parseEventList(response.data);
    },
  };
}
