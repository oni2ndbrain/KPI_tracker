import { buildQuizInactivityAlertData } from "../../kpi-engine/index.js";
import type { KpiState, QuizAnswerRecord, TargetCompany } from "../../kpi-engine/index.js";
import { buildCompetencyGapPoints } from "./competency-gap.js";
import { allDefinitions } from "./definitions.js";
import { buildKpiStatusRows } from "./kpi-status.js";
import { buildQuizCompetencyScores } from "./quiz-scores.js";
import { buildStatTiles } from "./stat-tiles.js";
import { buildTargetCompanyRows } from "./target-companies-view.js";
import type { DashboardViewModel } from "./types.js";

export interface BuildDashboardViewModelInput {
  kpis: KpiState[];
  targetCompanies: TargetCompany[];
  quizAnswers: QuizAnswerRecord[];
  /** ISO timestamp of the most recently completed 역량 진단 퀴즈, or null if none has ever been taken. */
  lastQuizAt: string | null;
  /** ISO date (YYYY-MM-DD) — "today", passed in rather than read from the clock so callers stay
   * deterministic and testable. */
  today: string;
  generatedAt?: string;
}

export function buildDashboardViewModel(input: BuildDashboardViewModelInput): DashboardViewModel {
  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    statTiles: buildStatTiles(input.kpis),
    kpiRows: buildKpiStatusRows(input.kpis),
    targetCompanies: buildTargetCompanyRows(input.targetCompanies, input.kpis, input.today),
    competencyGap: buildCompetencyGapPoints(input.targetCompanies, input.quizAnswers),
    quizCompetencyScores: buildQuizCompetencyScores(input.quizAnswers),
    daysSinceLastQuiz: buildQuizInactivityAlertData({ lastQuizAt: input.lastQuizAt, today: input.today })
      .daysSinceLastQuiz,
    definitions: allDefinitions(),
  };
}
