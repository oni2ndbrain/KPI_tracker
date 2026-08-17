import { describe, expect, test } from "vitest";
import { createKpi, recordProgress } from "../index.js";
import { buildRegularReportData } from "../index.js";
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

describe("buildRegularReportData", () => {
  test("every KPI becomes a fact, but only those behind target become a gap", () => {
    const behind = kpiAt("apply-count", "지원 건수", 10, 3);
    const met = kpiAt("interview-count", "면접 건수", 2, 2);

    const report = buildRegularReportData({
      period: "monthly",
      kpis: [behind, met],
      achievements: [],
      since: "2026-07-01T00:00:00.000Z",
      generatedAt: "2026-08-01T00:00:00.000Z",
    });

    expect(report.facts).toHaveLength(2);
    expect(report.facts.map((f) => f.kpiId)).toEqual(["apply-count", "interview-count"]);
    expect(report.gaps).toHaveLength(1);
    expect(report.gaps[0]?.kpiId).toBe("apply-count");
    expect(report.gaps[0]?.remaining).toBe(7);
  });

  test("a KPI exactly at its target is not a gap", () => {
    const met = kpiAt("interview-count", "면접 건수", 2, 2);

    const report = buildRegularReportData({
      period: "monthly",
      kpis: [met],
      achievements: [],
      since: "2026-07-01T00:00:00.000Z",
      generatedAt: "2026-08-01T00:00:00.000Z",
    });

    expect(report.gaps).toHaveLength(0);
  });

  test("gaps are sorted with the most lagging KPI first", () => {
    const closeToTarget = kpiAt("a", "A", 10, 9); // 90%
    const farFromTarget = kpiAt("b", "B", 10, 1); // 10%
    const midway = kpiAt("c", "C", 10, 5); // 50%

    const report = buildRegularReportData({
      period: "monthly",
      kpis: [closeToTarget, farFromTarget, midway],
      achievements: [],
      since: "2026-07-01T00:00:00.000Z",
      generatedAt: "2026-08-01T00:00:00.000Z",
    });

    expect(report.gaps.map((g) => g.kpiId)).toEqual(["b", "c", "a"]);
  });

  test("each gap gets a proposal naming the KPI and how much remains", () => {
    const behind = kpiAt("apply-count", "지원 건수", 10, 3);

    const report = buildRegularReportData({
      period: "monthly",
      kpis: [behind],
      achievements: [],
      since: "2026-07-01T00:00:00.000Z",
      generatedAt: "2026-08-01T00:00:00.000Z",
    });

    expect(report.proposals).toHaveLength(1);
    expect(report.proposals[0]?.kpiId).toBe("apply-count");
    expect(report.proposals[0]?.message).toContain("지원 건수");
    expect(report.proposals[0]?.message).toContain("7");
  });

  test("weekly reports cap gaps and proposals to the top 3 most lagging", () => {
    const kpis = [
      kpiAt("a", "A", 10, 1),
      kpiAt("b", "B", 10, 2),
      kpiAt("c", "C", 10, 3),
      kpiAt("d", "D", 10, 4),
    ];

    const report = buildRegularReportData({
      period: "weekly",
      kpis,
      achievements: [],
      since: "2026-07-25T00:00:00.000Z",
      generatedAt: "2026-08-01T00:00:00.000Z",
    });

    expect(report.gaps).toHaveLength(3);
    expect(report.proposals).toHaveLength(3);
    expect(report.gaps.map((g) => g.kpiId)).toEqual(["a", "b", "c"]);
  });

  test("monthly reports include every gap and proposal, not just the top 3", () => {
    const kpis = [
      kpiAt("a", "A", 10, 1),
      kpiAt("b", "B", 10, 2),
      kpiAt("c", "C", 10, 3),
      kpiAt("d", "D", 10, 4),
    ];

    const report = buildRegularReportData({
      period: "monthly",
      kpis,
      achievements: [],
      since: "2026-07-01T00:00:00.000Z",
      generatedAt: "2026-08-01T00:00:00.000Z",
    });

    expect(report.gaps).toHaveLength(4);
    expect(report.proposals).toHaveLength(4);
  });

  test("recent achievements are those discovered on/after the cutoff, most recent first", () => {
    const inWindow1 = achievement("in-1", "2026-07-26T00:00:00.000Z");
    const inWindow2 = achievement("in-2", "2026-07-28T00:00:00.000Z");
    const beforeWindow = achievement("before", "2026-06-01T00:00:00.000Z");
    const exactlyOnCutoff = achievement("on-cutoff", "2026-07-25T00:00:00.000Z");

    const report = buildRegularReportData({
      period: "weekly",
      kpis: [],
      achievements: [inWindow1, inWindow2, beforeWindow, exactlyOnCutoff],
      since: "2026-07-25T00:00:00.000Z",
      generatedAt: "2026-08-01T00:00:00.000Z",
    });

    expect(report.recentAchievements.map((a) => a.id)).toEqual(["in-2", "in-1", "on-cutoff"]);
  });

  test("carries through the period and generatedAt it was given", () => {
    const report = buildRegularReportData({
      period: "weekly",
      kpis: [],
      achievements: [],
      since: "2026-07-25T00:00:00.000Z",
      generatedAt: "2026-08-01T00:00:00.000Z",
    });

    expect(report.period).toBe("weekly");
    expect(report.generatedAt).toBe("2026-08-01T00:00:00.000Z");
  });

  test("weak items default to an empty list when none are given", () => {
    const report = buildRegularReportData({
      period: "weekly",
      kpis: [],
      achievements: [],
      since: "2026-07-25T00:00:00.000Z",
      generatedAt: "2026-08-01T00:00:00.000Z",
    });

    expect(report.weakItems).toEqual([]);
  });

  test("carries through the weak items it was given", () => {
    const weakItems = [
      {
        competency: "통계적 공정관리(SPC)",
        consecutiveWrongCount: 2,
        recommendation: { source: "llm-wiki" as const, title: "SPC 관리도 노트", reference: "note-1" },
      },
    ];

    const report = buildRegularReportData({
      period: "weekly",
      kpis: [],
      achievements: [],
      since: "2026-07-25T00:00:00.000Z",
      generatedAt: "2026-08-01T00:00:00.000Z",
      weakItems,
    });

    expect(report.weakItems).toEqual(weakItems);
  });
});
