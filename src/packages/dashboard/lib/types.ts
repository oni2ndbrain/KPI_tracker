import type { KpiCategory } from "../../kpi-engine/index.js";

/** One of the four stat tiles at the top of the 대시보드 panel — one per KPI category. */
export interface StatTile {
  category: KpiCategory;
  label: string;
  /** Pre-formatted for display, e.g. "62%", "3건", "3.4/5" — or "데이터 없음" when the category
   * has no KPIs yet, so the renderer never has to guess at a missing value. */
  valueText: string;
}

export type KpiStatus = "achieved" | "warning" | "danger";

/** One row of the KPI 현황 table — also the unit that "click a KPI item → 지표 정의서" resolves against. */
export interface KpiStatusRow {
  kpiId: string;
  kpiName: string;
  category: KpiCategory;
  currentValue: number;
  target: number;
  achievementRate: number;
  status: KpiStatus;
  statusText: string;
}

export type DeadlineUrgency = "danger" | "warning" | "neutral";

/** One row of the 목표 회사 panel. */
export interface TargetCompanyRow {
  id: string;
  name: string;
  /** ISO date (YYYY-MM-DD) */
  deadline: string;
  daysUntilDeadline: number;
  urgency: DeadlineUrgency;
  /** 0-1, clamped, from the linked 역량 채우기 KPI's achievementRate — 0 if the KPI can't be found. */
  progressRate: number;
  gap: string[];
  /** The linked 역량 채우기 KPI's id — the target of the "역량 점수 직접 조정" action. */
  kpiId: string;
  /** ISO timestamp of the "지원 완료" check, or null if not yet marked applied. */
  appliedAt: string | null;
}

/** One bar of the "역량 갭 (JD 요구 vs 보유)" chart. requiredScore is always 100 (the JD asks for
 * full coverage); heldScore is the quiz-verified score where available, or a binary 0/100 stand-in
 * from the target company's own gap analysis when no quiz has covered that competency yet. */
export interface CompetencyGapPoint {
  competency: string;
  requiredScore: number;
  heldScore: number;
}

/** The static 지표 정의서 content for one KPI category — what it means and how it's calculated.
 * Shown when a KPI item in the dashboard is clicked. */
export interface IndicatorDefinition {
  category: KpiCategory;
  categoryLabel: string;
  formula: string;
  dataSource: string;
  aggregationCadence: string;
  relatedKpis: string;
}

/** One point per competency in the "항목별 점수" quiz panel. */
export interface QuizCompetencyScore {
  competency: string;
  /** Average of all recorded answer scores for this competency, 1-5. */
  score: number;
}

export interface DashboardViewModel {
  generatedAt: string;
  statTiles: StatTile[];
  kpiRows: KpiStatusRow[];
  targetCompanies: TargetCompanyRow[];
  competencyGap: CompetencyGapPoint[];
  quizCompetencyScores: QuizCompetencyScore[];
  /** Days since the last completed 역량 진단 퀴즈, or null if none has ever been taken. */
  daysSinceLastQuiz: number | null;
  definitions: Record<KpiCategory, IndicatorDefinition>;
}

/** The canonical KPI category order used everywhere the dashboard iterates over all four
 * categories (stat tiles, the 지표 정의서 blocks) — kept in one place so the two can't drift apart. */
export const KPI_CATEGORY_ORDER: KpiCategory[] = [
  "competency-fill",
  "activity-count",
  "project-completion",
  "quiz-score",
];
