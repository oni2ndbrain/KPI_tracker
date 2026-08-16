import { describe, expect, test } from "vitest";
import type { DeadlineAlertData } from "../../kpi-engine/index.js";
import { deadlineAlertSubject, renderDeadlineAlertEmail } from "../index.js";

const data: DeadlineAlertData = {
  targetCompanyName: "삼성전자",
  kpiName: "삼성전자 역량 채우기",
  deadline: "2026-09-08",
  daysUntilDeadline: 7,
  achievementRate: 0.3,
  actionMessage: "D-7! 삼성전자 역량 채우기: 목표까지 역량 7개가 더 필요해요.",
  generatedAt: "2026-09-01T00:00:00.000Z",
};

describe("renderDeadlineAlertEmail", () => {
  test("renders plain HTML/CSS only — no <script> or <canvas>", () => {
    const html = renderDeadlineAlertEmail(data, { dashboardUrl: "https://dashboard.example/kpi" });

    expect(html.toLowerCase()).not.toContain("<script");
    expect(html.toLowerCase()).not.toContain("<canvas");
  });

  test("includes a link to the management dashboard", () => {
    const html = renderDeadlineAlertEmail(data, { dashboardUrl: "https://dashboard.example/kpi" });

    expect(html).toContain("https://dashboard.example/kpi");
  });

  test("names the target company, the D-day, and the concrete action to take", () => {
    const html = renderDeadlineAlertEmail(data, { dashboardUrl: "https://dashboard.example/kpi" });

    expect(html).toContain("삼성전자");
    expect(html).toContain("D-7");
    expect(html).toContain("목표까지 역량 7개가 더 필요해요");
  });

  test("matches the agreed golden layout", () => {
    const html = renderDeadlineAlertEmail(data, { dashboardUrl: "https://dashboard.example/kpi" });

    expect(html).toMatchSnapshot();
  });
});

describe("deadlineAlertSubject", () => {
  test("names the target company and the D-day", () => {
    expect(deadlineAlertSubject(data)).toBe("[KPI 알림] 삼성전자 지원 마감 D-7");
  });
});
