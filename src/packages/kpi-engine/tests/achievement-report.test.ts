import { describe, expect, test } from "vitest";
import { createKpi, recordProgress } from "../index.js";
import { buildAchievementReportData } from "../index.js";
import type { Achievement, KpiState } from "../index.js";

function kpiAt(id: string, name: string, target: number, amount: number): KpiState {
  return recordProgress(
    createKpi({ id, name, category: "activity-count", target }),
    { category: "activity-count", amount },
  );
}

function achievement(id: string, discoveredAt: string): Achievement {
  return {
    id,
    sourceId: `source-${id}`,
    sourceVersion: "v1",
    sourceType: "document",
    title: `성과 ${id}`,
    description: "설명",
    discoveredAt,
  };
}

describe("buildAchievementReportData", () => {
  test("carries the achieved KPI through as a fact", () => {
    const achieved = kpiAt("apply-count", "지원 건수", 10, 10);

    const report = buildAchievementReportData({
      achievedKpi: achieved,
      allKpis: [achieved],
      achievements: [],
      since: "2026-08-01T00:00:00.000Z",
      generatedAt: "2026-08-14T00:00:00.000Z",
    });

    expect(report.achievedKpi.kpiId).toBe("apply-count");
    expect(report.achievedKpi.currentValue).toBe(10);
    expect(report.achievedKpi.target).toBe(10);
    expect(report.achievedKpi.achievementRate).toBe(1);
  });

  test("every KPI (achieved or not) becomes part of the overall progress", () => {
    const achieved = kpiAt("apply-count", "지원 건수", 10, 10);
    const other = kpiAt("interview-count", "면접 건수", 4, 1);

    const report = buildAchievementReportData({
      achievedKpi: achieved,
      allKpis: [achieved, other],
      achievements: [],
      since: "2026-08-01T00:00:00.000Z",
      generatedAt: "2026-08-14T00:00:00.000Z",
    });

    expect(report.overallProgress.map((f) => f.kpiId)).toEqual(["apply-count", "interview-count"]);
  });

  test("what-was-done lists achievements discovered on/after the cutoff, most recent first", () => {
    const achieved = kpiAt("apply-count", "지원 건수", 10, 10);
    const inWindow1 = achievement("in-1", "2026-08-10T00:00:00.000Z");
    const inWindow2 = achievement("in-2", "2026-08-12T00:00:00.000Z");
    const beforeWindow = achievement("before", "2026-06-01T00:00:00.000Z");

    const report = buildAchievementReportData({
      achievedKpi: achieved,
      allKpis: [achieved],
      achievements: [inWindow1, inWindow2, beforeWindow],
      since: "2026-08-01T00:00:00.000Z",
      generatedAt: "2026-08-14T00:00:00.000Z",
    });

    expect(report.whatWasDone.map((a) => a.id)).toEqual(["in-2", "in-1"]);
  });

  test("suggests the most lagging KPI other than the one just achieved", () => {
    const achieved = kpiAt("apply-count", "지원 건수", 10, 10);
    const closeToTarget = kpiAt("a", "A", 10, 9); // 90%
    const farFromTarget = kpiAt("b", "B", 10, 1); // 10%

    const report = buildAchievementReportData({
      achievedKpi: achieved,
      allKpis: [achieved, closeToTarget, farFromTarget],
      achievements: [],
      since: "2026-08-01T00:00:00.000Z",
      generatedAt: "2026-08-14T00:00:00.000Z",
    });

    expect(report.laggingSuggestion?.kpiId).toBe("b");
    expect(report.laggingSuggestion?.message).toContain("B");
  });

  test("lagging suggestion is null when every other KPI is also at target", () => {
    const achieved = kpiAt("apply-count", "지원 건수", 10, 10);
    const alsoMet = kpiAt("interview-count", "면접 건수", 2, 2);

    const report = buildAchievementReportData({
      achievedKpi: achieved,
      allKpis: [achieved, alsoMet],
      achievements: [],
      since: "2026-08-01T00:00:00.000Z",
      generatedAt: "2026-08-14T00:00:00.000Z",
    });

    expect(report.laggingSuggestion).toBeNull();
  });

  test("carries through the generatedAt it was given", () => {
    const achieved = kpiAt("apply-count", "지원 건수", 10, 10);

    const report = buildAchievementReportData({
      achievedKpi: achieved,
      allKpis: [achieved],
      achievements: [],
      since: "2026-08-01T00:00:00.000Z",
      generatedAt: "2026-08-14T00:00:00.000Z",
    });

    expect(report.generatedAt).toBe("2026-08-14T00:00:00.000Z");
  });

  test("weak items default to an empty list when none are given", () => {
    const achieved = kpiAt("apply-count", "지원 건수", 10, 10);

    const report = buildAchievementReportData({
      achievedKpi: achieved,
      allKpis: [achieved],
      achievements: [],
      since: "2026-08-01T00:00:00.000Z",
      generatedAt: "2026-08-14T00:00:00.000Z",
    });

    expect(report.weakItems).toEqual([]);
  });

  test("carries through the weak items it was given", () => {
    const achieved = kpiAt("apply-count", "지원 건수", 10, 10);
    const weakItems = [
      {
        competency: "통계적 공정관리(SPC)",
        consecutiveWrongCount: 3,
        recommendation: { source: "web-search" as const, title: "SPC 관리도 개론", reference: "https://example.com/spc" },
      },
    ];

    const report = buildAchievementReportData({
      achievedKpi: achieved,
      allKpis: [achieved],
      achievements: [],
      since: "2026-08-01T00:00:00.000Z",
      generatedAt: "2026-08-14T00:00:00.000Z",
      weakItems,
    });

    expect(report.weakItems).toEqual(weakItems);
  });
});
