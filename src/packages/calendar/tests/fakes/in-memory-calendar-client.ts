import type { CalendarClient, CalendarEvent } from "../../index.js";

export interface InMemoryCalendarClient extends CalendarClient {
  events: CalendarEvent[];
}

/** In-memory stand-in for Google Calendar, used only in tests — never touches a real calendar. */
export function createInMemoryCalendarClient(seed: CalendarEvent[] = []): InMemoryCalendarClient {
  const events = [...seed];
  let nextId = 1;

  return {
    events,

    async createEvent(event) {
      const created: CalendarEvent = { id: `event-${nextId++}`, ...event };
      events.push(created);
      return created;
    },

    async listEvents() {
      return [...events];
    },
  };
}
