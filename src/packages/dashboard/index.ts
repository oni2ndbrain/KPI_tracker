export type {
  CompetencyGapPoint,
  DashboardViewModel,
  DeadlineUrgency,
  IndicatorDefinition,
  KpiStatus,
  KpiStatusRow,
  QuizCompetencyScore,
  StatTile,
  TargetCompanyRow,
} from "./lib/types.js";
export { KPI_CATEGORY_ORDER } from "./lib/types.js";
export { buildStatTiles } from "./lib/stat-tiles.js";
export { buildKpiStatusRows } from "./lib/kpi-status.js";
export { buildTargetCompanyRows } from "./lib/target-companies-view.js";
export { buildCompetencyGapPoints } from "./lib/competency-gap.js";
export { buildQuizCompetencyScores } from "./lib/quiz-scores.js";
export { allDefinitions } from "./lib/definitions.js";
export type { BuildDashboardViewModelInput } from "./lib/view-model.js";
export { buildDashboardViewModel } from "./lib/view-model.js";
export { renderDashboardPage } from "./lib/dashboard-html.js";
export type { QuizAnswerResultPageInput, QuizQuestionsPageInput } from "./lib/quiz-session-html.js";
export {
  renderActionErrorPage,
  renderQuizAnswerResultPage,
  renderQuizQuestionsPage,
} from "./lib/quiz-session-html.js";
