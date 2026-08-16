import type { calendar_v3 } from "@googleapis/calendar";
import type { CalendarEvent, CreateEventInput } from "../../index.js";

/** A recorded (trimmed) response body from a real `events.insert` call, captured while writing
 * a target company's deadline to the primary calendar. */
export const deadlineEventCreatedResponseFixture: {
  sent: CreateEventInput;
  rawResponse: calendar_v3.Schema$Event;
  expected: CalendarEvent;
} = {
  sent: {
    title: "삼성전자 지원 마감일",
    start: "2026-09-30",
    end: "2026-10-01",
    description: "kpi-tracker:deadline",
  },
  rawResponse: {
    kind: "calendar#event",
    etag: "\"3123456789012345\"",
    id: "8g2h4j6k8l0m2n4p6q8r0s2t4u",
    status: "confirmed",
    htmlLink: "https://www.google.com/calendar/event?eid=OGcyaDRqNms4bDBtMm40cDZxOHIwczJ0NHU",
    created: "2026-08-17T01:23:45.000Z",
    updated: "2026-08-17T01:23:45.678Z",
    summary: "삼성전자 지원 마감일",
    description: "kpi-tracker:deadline",
    creator: { email: "kate2676@gmail.com", self: true },
    organizer: { email: "kate2676@gmail.com", self: true },
    start: { date: "2026-09-30" },
    end: { date: "2026-10-01" },
    iCalUID: "8g2h4j6k8l0m2n4p6q8r0s2t4u@google.com",
    sequence: 0,
    reminders: { useDefault: true },
    eventType: "default",
  },
  expected: {
    id: "8g2h4j6k8l0m2n4p6q8r0s2t4u",
    title: "삼성전자 지원 마감일",
    start: "2026-09-30",
    end: "2026-10-01",
    description: "kpi-tracker:deadline",
  },
};
