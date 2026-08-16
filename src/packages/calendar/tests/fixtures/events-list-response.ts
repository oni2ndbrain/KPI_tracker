import type { calendar_v3 } from "@googleapis/calendar";
import type { CalendarEvent } from "../../index.js";

/** A recorded (trimmed) response body from a real `events.list` call against the primary
 * calendar — a mix of a system-written deadline event, an application-period entry the user
 * typed in by hand, an all-day event unrelated to any target company, and a timed (non-all-day)
 * event that should be filtered out entirely. */
export const eventsListResponseFixture: {
  rawResponse: calendar_v3.Schema$Events;
  expected: CalendarEvent[];
} = {
  rawResponse: {
    kind: "calendar#events",
    etag: "\"p123456789012345\"",
    summary: "kate2676@gmail.com",
    timeZone: "Asia/Seoul",
    accessRole: "owner",
    items: [
      {
        kind: "calendar#event",
        id: "8g2h4j6k8l0m2n4p6q8r0s2t4u",
        status: "confirmed",
        summary: "삼성전자 지원 마감일",
        description: "kpi-tracker:deadline",
        start: { date: "2026-09-30" },
        end: { date: "2026-10-01" },
        iCalUID: "8g2h4j6k8l0m2n4p6q8r0s2t4u@google.com",
      },
      {
        kind: "calendar#event",
        id: "1a3c5e7g9i1k3m5o7q9s1u3w5y",
        status: "confirmed",
        summary: "삼성전자 지원 기간",
        start: { date: "2026-09-01" },
        end: { date: "2026-09-25" },
        iCalUID: "1a3c5e7g9i1k3m5o7q9s1u3w5y@google.com",
      },
      {
        kind: "calendar#event",
        id: "2b4d6f8h0j2l4n6p8r0t2v4x6z",
        status: "confirmed",
        summary: "친구 생일",
        start: { date: "2026-09-12" },
        end: { date: "2026-09-13" },
        iCalUID: "2b4d6f8h0j2l4n6p8r0t2v4x6z@google.com",
      },
      {
        kind: "calendar#event",
        id: "3c5e7g9i1k3m5o7q9s1u3w5y7a",
        status: "confirmed",
        summary: "SK하이닉스 면접",
        start: { dateTime: "2026-09-15T10:00:00+09:00", timeZone: "Asia/Seoul" },
        end: { dateTime: "2026-09-15T11:00:00+09:00", timeZone: "Asia/Seoul" },
        iCalUID: "3c5e7g9i1k3m5o7q9s1u3w5y7a@google.com",
      },
    ],
  },
  expected: [
    {
      id: "8g2h4j6k8l0m2n4p6q8r0s2t4u",
      title: "삼성전자 지원 마감일",
      start: "2026-09-30",
      end: "2026-10-01",
      description: "kpi-tracker:deadline",
    },
    {
      id: "1a3c5e7g9i1k3m5o7q9s1u3w5y",
      title: "삼성전자 지원 기간",
      start: "2026-09-01",
      end: "2026-09-25",
      description: undefined,
    },
    {
      id: "2b4d6f8h0j2l4n6p8r0t2v4x6z",
      title: "친구 생일",
      start: "2026-09-12",
      end: "2026-09-13",
      description: undefined,
    },
  ],
};
