import { currentValueFor } from "./lib/categories.js";
import type { KpiDefinition, KpiState, ProgressEvent } from "./lib/types.js";

export type {
  Achievement,
  AchievementSourceType,
  KpiCategory,
  KpiDefinition,
  KpiState,
  ProgressEvent,
  TargetCompany,
} from "./lib/types.js";
export type {
  BuildRegularReportInput,
  RegularReportData,
  ReportFact,
  ReportGap,
  ReportPeriod,
  ReportProposal,
} from "./lib/regular-report.js";
export { buildRegularReportData } from "./lib/regular-report.js";
export type { AchievementReportData, BuildAchievementReportInput } from "./lib/achievement-report.js";
export { buildAchievementReportData } from "./lib/achievement-report.js";
export { justReachedTarget } from "./lib/achievement-detection.js";
export type { DeadlineAlertData, DeadlineAlertInput, DeadlineCheckpoint } from "./lib/deadline-alert.js";
export { buildDeadlineAlertData, shouldSendDeadlineAlert } from "./lib/deadline-alert.js";
export type { QuizInactivityAlertData, QuizInactivityInput } from "./lib/quiz-inactivity-alert.js";
export { buildQuizInactivityAlertData, shouldSendQuizInactivityAlert } from "./lib/quiz-inactivity-alert.js";

export function createKpi(definition: KpiDefinition): KpiState {
  return {
    definition,
    history: [],
    currentValue: 0,
    achievementRate: 0,
  };
}

function eventValue(event: ProgressEvent): number {
  switch (event.category) {
    case "activity-count":
    case "competency-fill":
      return event.amount ?? 1;
    case "project-completion":
      return event.percentage;
    case "quiz-score":
      return event.score;
  }
}

export function recordProgress(kpi: KpiState, event: ProgressEvent): KpiState {
  if (event.category !== kpi.definition.category) {
    throw new Error(
      `progress event category "${event.category}" does not match KPI category "${kpi.definition.category}"`,
    );
  }

  const history = [...kpi.history, eventValue(event)];
  const currentValue = currentValueFor(kpi.definition.category, history);

  return {
    definition: kpi.definition,
    history,
    currentValue,
    achievementRate: currentValue / kpi.definition.target,
  };
}
