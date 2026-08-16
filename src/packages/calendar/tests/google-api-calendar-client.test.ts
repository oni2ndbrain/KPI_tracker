import { describe, expect, test } from "vitest";
import { parseCreatedEvent, parseEventList, toEventRequestBody } from "../index.js";
import { deadlineEventCreatedResponseFixture } from "./fixtures/deadline-event-created-response.js";
import { eventsListResponseFixture } from "./fixtures/events-list-response.js";

describe("toEventRequestBody", () => {
  test("builds an all-day event request body from a create-event input", () => {
    const body = toEventRequestBody(deadlineEventCreatedResponseFixture.sent);

    expect(body).toEqual({
      summary: "삼성전자 지원 마감일",
      description: "kpi-tracker:deadline",
      start: { date: "2026-09-30" },
      end: { date: "2026-10-01" },
    });
  });
});

describe("parseCreatedEvent", () => {
  test("parses a recorded events.insert response into a CalendarEvent", () => {
    const event = parseCreatedEvent(
      deadlineEventCreatedResponseFixture.rawResponse,
      deadlineEventCreatedResponseFixture.sent,
    );

    expect(event).toEqual(deadlineEventCreatedResponseFixture.expected);
  });

  test("throws if the response has no id", () => {
    expect(() => parseCreatedEvent({}, deadlineEventCreatedResponseFixture.sent)).toThrow();
  });
});

describe("parseEventList", () => {
  test("parses a recorded events.list response into CalendarEvents", () => {
    const events = parseEventList(eventsListResponseFixture.rawResponse);

    expect(events).toEqual(eventsListResponseFixture.expected);
  });

  test("drops timed (non-all-day) events", () => {
    const events = parseEventList(eventsListResponseFixture.rawResponse);

    expect(events.find((event) => event.title === "SK하이닉스 면접")).toBeUndefined();
  });

  test("an empty items list yields an empty array", () => {
    expect(parseEventList({})).toEqual([]);
  });
});
