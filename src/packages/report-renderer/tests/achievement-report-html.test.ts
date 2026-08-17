import { describe, expect, test } from "vitest";
import type { AchievementReportData } from "../../kpi-engine/index.js";
import { achievementReportSubject, renderAchievementReportEmail } from "../index.js";

const dataWithLagging: AchievementReportData = {
  generatedAt: "2026-08-14T00:00:00.000Z",
  achievedKpi: {
    kpiId: "apply-count-2026-08",
    kpiName: "이번 달 지원 건수",
    category: "activity-count",
    currentValue: 10,
    target: 10,
    achievementRate: 1,
  },
  whatWasDone: [
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
  overallProgress: [
    {
      kpiId: "apply-count-2026-08",
      kpiName: "이번 달 지원 건수",
      category: "activity-count",
      currentValue: 10,
      target: 10,
      achievementRate: 1,
    },
    {
      kpiId: "samsung-competency-fill",
      kpiName: "삼성전자 공정기술 역량 채우기",
      category: "competency-fill",
      currentValue: 5,
      target: 8,
      achievementRate: 0.625,
    },
  ],
  laggingSuggestion: {
    kpiId: "samsung-competency-fill",
    kpiName: "삼성전자 공정기술 역량 채우기",
    message: "삼성전자 공정기술 역량 채우기: 목표까지 역량 3개가 더 필요해요.",
  },
  weakItems: [
    {
      competency: "통계적 공정관리(SPC)",
      consecutiveWrongCount: 2,
      recommendation: { source: "web-search", title: "SPC 관리도 개론", reference: "https://example.com/spc" },
    },
  ],
};

const dataWithoutLagging: AchievementReportData = {
  ...dataWithLagging,
  laggingSuggestion: null,
};

describe("renderAchievementReportEmail", () => {
  test("renders plain HTML/CSS only — no <script> or <canvas>", () => {
    const html = renderAchievementReportEmail(dataWithLagging, { dashboardUrl: "https://dashboard.example/kpi" });

    expect(html.toLowerCase()).not.toContain("<script");
    expect(html.toLowerCase()).not.toContain("<canvas");
  });

  test("includes a link to the management dashboard", () => {
    const html = renderAchievementReportEmail(dataWithLagging, { dashboardUrl: "https://dashboard.example/kpi" });

    expect(html).toContain("https://dashboard.example/kpi");
  });

  test("names the achieved KPI in the achievement banner", () => {
    const html = renderAchievementReportEmail(dataWithLagging, { dashboardUrl: "https://dashboard.example/kpi" });

    expect(html).toContain("이번 달 지원 건수");
  });

  test("includes each weak item's competency, streak count, and study recommendation", () => {
    const html = renderAchievementReportEmail(dataWithLagging, { dashboardUrl: "https://dashboard.example/kpi" });

    expect(html).toContain("통계적 공정관리(SPC)");
    expect(html).toContain("2회 연속 오답");
    expect(html).toContain("SPC 관리도 개론");
    expect(html).toContain("새로 찾은 자료");
  });

  test("with a lagging suggestion matches the agreed golden layout", () => {
    const html = renderAchievementReportEmail(dataWithLagging, { dashboardUrl: "https://dashboard.example/kpi" });

    expect(html).toMatchSnapshot();
  });

  test("with no lagging suggestion (everything else is also at target) matches the agreed golden layout", () => {
    const html = renderAchievementReportEmail(dataWithoutLagging, { dashboardUrl: "https://dashboard.example/kpi" });

    expect(html).toMatchSnapshot();
  });
});

describe("achievementReportSubject", () => {
  test("names the achieved KPI and date", () => {
    expect(achievementReportSubject(dataWithLagging)).toBe("[KPI 달성] 이번 달 지원 건수 · 2026-08-14");
  });
});
