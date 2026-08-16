import { proposalMessageFor, remainingToTarget, toReportFact } from "./report-fact.js";
import type { ReportFact, ReportProposal } from "./report-fact.js";
import type { Achievement, KpiState } from "./types.js";

export interface AchievementReportData {
  generatedAt: string;
  achievedKpi: ReportFact;
  whatWasDone: Achievement[];
  overallProgress: ReportFact[];
  /** A concrete suggestion for the single most-lagging KPI other than the one just achieved, or
   * null when every other KPI is also at target. */
  laggingSuggestion: ReportProposal | null;
}

export interface BuildAchievementReportInput {
  achievedKpi: KpiState;
  allKpis: KpiState[];
  achievements: Achievement[];
  /** ISO timestamp; achievements discovered on or after this count as "what was done". */
  since: string;
  generatedAt?: string;
}

export function buildAchievementReportData(input: BuildAchievementReportInput): AchievementReportData {
  const { achievedKpi, allKpis, achievements, since } = input;
  const generatedAt = input.generatedAt ?? new Date().toISOString();

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
  };
}
