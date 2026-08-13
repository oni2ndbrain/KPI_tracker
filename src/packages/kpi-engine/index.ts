import { currentValueFor } from "./lib/categories.js";
import type { KpiDefinition, KpiState, ProgressEvent } from "./lib/types.js";

export type { KpiCategory, KpiDefinition, KpiState, ProgressEvent } from "./lib/types.js";

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
