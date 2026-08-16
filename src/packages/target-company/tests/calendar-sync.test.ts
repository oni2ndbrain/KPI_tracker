import { describe, expect, test } from "vitest";
import type { CalendarEvent } from "../../calendar/index.js";
import { buildDeadlineEvent, DEADLINE_EVENT_MARKER, matchApplicationPeriods } from "../index.js";

describe("buildDeadlineEvent", () => {
  test("builds an all-day event on the deadline date, tagged as system-written", () => {
    const event = buildDeadlineEvent({ name: "삼성전자", deadline: "2026-09-30" });

    expect(event).toEqual({
      title: "삼성전자 지원 마감일",
      start: "2026-09-30",
      end: "2026-10-01",
      description: DEADLINE_EVENT_MARKER,
    });
  });

  test("rolls over month/year boundaries for the exclusive end date", () => {
    const event = buildDeadlineEvent({ name: "SK하이닉스", deadline: "2026-12-31" });

    expect(event.end).toBe("2027-01-01");
  });
});

describe("matchApplicationPeriods", () => {
  function event(overrides: Partial<CalendarEvent>): CalendarEvent {
    return { id: "event-1", title: "", start: "2026-09-01", end: "2026-09-25", ...overrides };
  }

  test("matches a calendar entry whose title contains the target company's name", () => {
    const events = [event({ title: "삼성전자 지원 기간", start: "2026-09-01", end: "2026-09-25" })];
    const companies = [{ id: "samsung", name: "삼성전자" }];

    const result = matchApplicationPeriods(events, companies);

    expect(result.get("samsung")).toEqual({ start: "2026-09-01", end: "2026-09-25" });
  });

  test("ignores the system-written deadline event even though its title also contains the company name", () => {
    const events = [
      event({ title: "삼성전자 지원 마감일", start: "2026-09-30", end: "2026-10-01", description: DEADLINE_EVENT_MARKER }),
    ];
    const companies = [{ id: "samsung", name: "삼성전자" }];

    const result = matchApplicationPeriods(events, companies);

    expect(result.has("samsung")).toBe(false);
  });

  test("a company with no matching calendar entry is absent from the result", () => {
    const events = [event({ title: "친구 생일" })];
    const companies = [{ id: "samsung", name: "삼성전자" }];

    const result = matchApplicationPeriods(events, companies);

    expect(result.has("samsung")).toBe(false);
  });

  test("matches multiple companies independently", () => {
    const events = [
      event({ id: "e1", title: "삼성전자 지원 기간", start: "2026-09-01", end: "2026-09-25" }),
      event({ id: "e2", title: "SK하이닉스 지원 기간", start: "2026-10-01", end: "2026-10-10" }),
    ];
    const companies = [
      { id: "samsung", name: "삼성전자" },
      { id: "skhynix", name: "SK하이닉스" },
    ];

    const result = matchApplicationPeriods(events, companies);

    expect(result.get("samsung")).toEqual({ start: "2026-09-01", end: "2026-09-25" });
    expect(result.get("skhynix")).toEqual({ start: "2026-10-01", end: "2026-10-10" });
  });
});
