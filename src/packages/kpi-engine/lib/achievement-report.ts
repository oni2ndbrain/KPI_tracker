import { proposalMessageFor, remainingToTarget, toReportFact } from "./report-fact.js";
import type { ReportFact, ReportProposal } from "./report-fact.js";
import type { Achievement, KpiState, WeakItemReport } from "./types.js";

export interface AchievementReportData {
  generatedAt: string;
  achievedKpi: ReportFact;
  whatWasDone: Achievement[];
  overallProgress: ReportFact[];
  /** A concrete suggestion for the single most-lagging KPI other than the one just achieved, or
   * null when every other KPI is also at target. */
  laggingSuggestion: ReportProposal | null;
  weakItems: WeakItemReport[];
}

export interface BuildAchievementReportInput {
  achievedKpi: KpiState;
  allKpis: KpiState[];
  achievements: Achievement[];
  /** ISO timestamp; achievements discovered on or after this count as "what was done". */
  since: string;
  generatedAt?: string;
  /** 역량 진단 퀴즈 weak items to highlight, each with a study recommendation. Defaults to none —
   * callers that don't track quiz weak items can omit this entirely. */
  weakItems?: WeakItemReport[];
}

export function buildAchievementReportData(input: BuildAchievementReportInput): AchievementReportData {
  const { achievedKpi, allKpis, achievements, since } = input;
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const weakItems = input.weakItems ?? [];

  const whatWasDone = achievements
    .filter((achievement) => achievement.discoveredAt >= since)
    .sort((a, b) => (a.discoveredAt < b.discoveredAt ? 1 : a.discoveredAt > b.discoveredAt ? -1 : 0));

  const overallProgress = allKpis.map(toReportFact);

  const mostLagging = allKpis
    .filter((kpi) => kpi.definition.id !== achievedKpi.definition.id && kpi.achievementRate < 1)
    .sort((a, b) => a.achievementRate - b.achievementRate)[0];

  const laggingSuggestion: ReportProposal | null = mostLagging
    ? {
        kpiId: mostLagging.definition.id,
        kpiName: mostLagging.definition.name,
        message: proposalMessageFor(mostLagging.definition.category, mostLagging.definition.name, remainingToTarget(mostLagging)),
      }
    : null;

  return {
    generatedAt,
    achievedKpi: toReportFact(achievedKpi),
    whatWasDone,
    overallProgress,
    laggingSuggestion,
    weakItems,
  };
}
