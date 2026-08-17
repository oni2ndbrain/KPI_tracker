import { describe, expect, test } from "vitest";
import { buildQuizInactivityAlertData, shouldSendQuizInactivityAlert } from "../index.js";

describe("shouldSendQuizInactivityAlert", () => {
  test("true when a quiz has never been taken", () => {
    expect(shouldSendQuizInactivityAlert({ lastQuizAt: null, today: "2026-08-14T00:00:00.000Z" })).toBe(true);
  });

  test("true at exactly 7 days since the last quiz", () => {
    const result = shouldSendQuizInactivityAlert({
      lastQuizAt: "2026-08-07T00:00:00.000Z",
      today: "2026-08-14T00:00:00.000Z",
    });

    expect(result).toBe(true);
  });

  test("true when more than 7 days have passed", () => {
    const result = shouldSendQuizInactivityAlert({
      lastQuizAt: "2026-08-01T00:00:00.000Z",
      today: "2026-08-14T00:00:00.000Z",
    });

    expect(result).toBe(true);
  });

  test("false when fewer than 7 days have passed", () => {
    const result = shouldSendQuizInactivityAlert({
      lastQuizAt: "2026-08-10T00:00:00.000Z",
      today: "2026-08-14T00:00:00.000Z",
    });

    expect(result).toBe(false);
  });
});

describe("buildQuizInactivityAlertData", () => {
  test("reports how many days have passed since the last quiz", () => {
    const data = buildQuizInactivityAlertData({
      lastQuizAt: "2026-08-07T00:00:00.000Z",
      today: "2026-08-14T00:00:00.000Z",
      generatedAt: "2026-08-14T00:00:00.000Z",
    });

    expect(data.daysSinceLastQuiz).toBe(7);
    expect(data.generatedAt).toBe("2026-08-14T00:00:00.000Z");
  });

  test("reports null days-since when a quiz has never been taken", () => {
    const data = buildQuizInactivityAlertData({ lastQuizAt: null, today: "2026-08-14T00:00:00.000Z" });

    expect(data.daysSinceLastQuiz).toBeNull();
  });

  test("clamps to 0 when a same-day quiz timestamp falls after a bare-date 'today'", () => {
    // today is a date-only string (implicit midnight); a quiz taken earlier the same real day
    // carries a later time-of-day, which would otherwise floor to -1.
    const data = buildQuizInactivityAlertData({
      lastQuizAt: "2026-08-17T12:00:00.000Z",
      today: "2026-08-17",
    });

    expect(data.daysSinceLastQuiz).toBe(0);
  });
});
