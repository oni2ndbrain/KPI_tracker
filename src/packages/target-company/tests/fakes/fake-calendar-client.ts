import type { CalendarClient, CalendarEvent } from "../../../calendar/index.js";

export interface FakeCalendarClient extends CalendarClient {
  created: CalendarEvent[];
}

/** In-memory stand-in for CalendarClient, used only in tests — never touches Google Calendar. */
export function createFakeCalendarClient(seed: CalendarEvent[] = []): FakeCalendarClient {
  const events = [...seed];
  const created: CalendarEvent[] = [];
  let nextId = 1;

  return {
    created,
    async createEvent(event) {
      const record: CalendarEvent = { id: `event-${nextId++}`, ...event };
      events.push(record);
      created.push(record);
      return record;
    },
    async listEvents() {
      return [...events];
    },
  };
}
