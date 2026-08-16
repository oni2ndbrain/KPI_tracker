import { remainingToTarget, toReportFact, proposalMessageFor } from "./report-fact.js";
import type { ReportFact, ReportProposal } from "./report-fact.js";
import type { Achievement, KpiCategory, KpiState } from "./types.js";

export type { ReportFact, ReportProposal } from "./report-fact.js";

export type ReportPeriod = "weekly" | "monthly";

// Weekly reports are a short pulse-check; monthly reports are a deep dive. Capping how many
// lagging KPIs surface keeps the weekly email skimmable without hiding data — monthly shows all.
const WEEKLY_GAP_LIMIT = 3;

export interface ReportGap {
  kpiId: string;
  kpiName: string;
  category: KpiCategory;
  achievementRate: number;
  /** How much is left to reach target, in the KPI's own unit (count/%/points). Never negative. */
  remaining: number;
}

export interface RegularReportData {
  period: ReportPeriod;
  generatedAt: string;
  facts: ReportFact[];
  gaps: ReportGap[];
  proposals: ReportProposal[];
  recentAchievements: Achievement[];
}

export interface BuildRegularReportInput {
  period: ReportPeriod;
  kpis: KpiState[];
  achievements: Achievement[];
  /** ISO timestamp; achievements discovered on or after this count as "recent". */
  since: string;
  generatedAt?: string;
}

export function buildRegularReportData(input: BuildRegularReportInput): RegularReportData {
  const { period, kpis, achievements, since } = input;
  const generatedAt = input.generatedAt ?? new Date().toISOString();

  const facts: ReportFact[] = kpis.map(toReportFact);

  const allGaps: ReportGap[] = kpis
    .filter((kpi) => kpi.achievementRate < 1)
    .map((kpi) => ({
      kpiId: kpi.definition.id,
      kpiName: kpi.definition.name,
      category: kpi.definition.category,
      achievementRate: kpi.achievementRate,
      remaining: remainingToTarget(kpi),
    }))
    .sort((a, b) => a.achievementRate - b.achievementRate);

  const gaps = period === "weekly" ? allGaps.slice(0, WEEKLY_GAP_LIMIT) : allGaps;

  const proposals: ReportProposal[] = gaps.map((gap) => ({
    kpiId: gap.kpiId,
    kpiName: gap.kpiName,
    message: proposalMessageFor(gap.category, gap.kpiName, gap.remaining),
  }));

  const recentAchievements = achievements
    .filter((achievement) => achievement.discoveredAt >= since)
    .sort((a, b) => (a.discoveredAt < b.discoveredAt ? 1 : a.discoveredAt > b.discoveredAt ? -1 : 0));

  return { period, generatedAt, facts, gaps, proposals, recentAchievements };
}
