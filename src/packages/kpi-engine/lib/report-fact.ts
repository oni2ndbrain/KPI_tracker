import type { KpiCategory, KpiState } from "./types.js";

// Shared by regular-report.ts and achievement-report.ts, which both turn KPI state into
// facts/proposals for a report — kept in one place so the two report shapes can't drift apart.

export interface ReportFact {
  kpiId: string;
  kpiName: string;
  category: KpiCategory;
  currentValue: number;
  target: number;
  achievementRate: number;
}

export interface ReportProposal {
  kpiId: string;
  kpiName: string;
  message: string;
}

export function toReportFact(kpi: KpiState): ReportFact {
  return {
    kpiId: kpi.definition.id,
    kpiName: kpi.definition.name,
    category: kpi.definition.category,
    currentValue: kpi.currentValue,
    target: kpi.definition.target,
    achievementRate: kpi.achievementRate,
  };
}

export function proposalMessageFor(category: KpiCategory, kpiName: string, remaining: number): string {
  switch (category) {
    case "competency-fill":
      return `${kpiName}: 목표까지 역량 ${remaining}개가 더 필요해요.`;
    case "project-completion":
      return `${kpiName}: 목표까지 ${remaining}%p 남았어요.`;
    case "activity-count":
      return `${kpiName}: 목표까지 ${remaining}건 남았어요.`;
    case "quiz-score":
      return `${kpiName}: 평균 점수가 목표보다 ${remaining}점 낮아요. 역량 진단 퀴즈를 더 진행해보세요.`;
  }
}

export function remainingToTarget(kpi: KpiState): number {
  return Math.max(0, kpi.definition.target - kpi.currentValue);
}
