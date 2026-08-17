import { describe, expect, test } from "vitest";
import type { RegularReportData } from "../../kpi-engine/index.js";
import { regularReportSubject, renderRegularReportEmail } from "../index.js";

const weeklyData: RegularReportData = {
  period: "weekly",
  generatedAt: "2026-08-14T00:00:00.000Z",
  facts: [
    {
      kpiId: "samsung-competency-fill",
      kpiName: "삼성전자 공정기술 역량 채우기",
      category: "competency-fill",
      currentValue: 5,
      target: 8,
      achievementRate: 0.625,
    },
    {
      kpiId: "apply-count-2026-08",
      kpiName: "이번 달 지원 건수",
      category: "activity-count",
      currentValue: 10,
      target: 10,
      achievementRate: 1,
    },
  ],
  gaps: [
    {
      kpiId: "samsung-competency-fill",
      kpiName: "삼성전자 공정기술 역량 채우기",
      category: "competency-fill",
      achievementRate: 0.625,
      remaining: 3,
    },
  ],
  proposals: [
    {
      kpiId: "samsung-competency-fill",
      kpiName: "삼성전자 공정기술 역량 채우기",
      message: "삼성전자 공정기술 역량 채우기: 목표까지 역량 3개가 더 필요해요.",
    },
  ],
  recentAchievements: [
    {
      id: "ach-1",
      sourceId: "doc-1",
      sourceVersion: "v1",
      sourceType: "document",
      title: "식각 공정 불량 원인 분석 보고서 작성",
      description: "설명",
      discoveredAt: "2026-08-12T00:00:00.000Z",
    },
  ],
  weakItems: [
    {
      competency: "통계적 공정관리(SPC)",
      consecutiveWrongCount: 2,
      recommendation: { source: "llm-wiki", title: "SPC 관리도 노트", reference: "note-1" },
    },
  ],
};

const monthlyData: RegularReportData = {
  ...weeklyData,
  period: "monthly",
};

describe("renderRegularReportEmail", () => {
  test("renders plain HTML/CSS only — no <script> or <canvas>", () => {
    const html = renderRegularReportEmail(weeklyData, { dashboardUrl: "https://dashboard.example/kpi" });

    expect(html.toLowerCase()).not.toContain("<script");
    expect(html.toLowerCase()).not.toContain("<canvas");
  });

  test("includes a link to the management dashboard", () => {
    const html = renderRegularReportEmail(weeklyData, { dashboardUrl: "https://dashboard.example/kpi" });

    expect(html).toContain("https://dashboard.example/kpi");
  });

  test("includes each weak item's competency, streak count, and study recommendation", () => {
    const html = renderRegularReportEmail(weeklyData, { dashboardUrl: "https://dashboard.example/kpi" });

    expect(html).toContain("통계적 공정관리(SPC)");
    expect(html).toContain("2회 연속 오답");
    expect(html).toContain("SPC 관리도 노트");
    expect(html).toContain("LLM Wiki");
  });

  test("weekly report matches the agreed golden layout", () => {
    const html = renderRegularReportEmail(weeklyData, { dashboardUrl: "https://dashboard.example/kpi" });

    expect(html).toMatchSnapshot();
  });

  test("monthly report matches the agreed golden layout", () => {
    const html = renderRegularReportEmail(monthlyData, { dashboardUrl: "https://dashboard.example/kpi" });

    expect(html).toMatchSnapshot();
  });
});

describe("regularReportSubject", () => {
  test("names the weekly cadence and date", () => {
    expect(regularReportSubject(weeklyData)).toBe("[KPI 리포트] 주간 요약 · 2026-08-14");
  });

  test("names the monthly cadence and date", () => {
    expect(regularReportSubject(monthlyData)).toBe("[KPI 리포트] 월간 심층 리포트 · 2026-08-14");
  });
});
