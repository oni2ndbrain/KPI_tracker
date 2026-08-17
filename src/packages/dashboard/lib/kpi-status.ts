import type { KpiState } from "../../kpi-engine/index.js";
import type { KpiStatus, KpiStatusRow } from "./types.js";

// Below this rate a KPI counts as "danger" rather than merely "warning" — matches the reading of
// the agreed mockup's example rows (62% renders danger, 80% renders warning).
const DANGER_THRESHOLD = 0.75;

function statusFor(achievementRate: number): KpiStatus {
  if (achievementRate >= 1) return "achieved";
  if (achievementRate >= DANGER_THRESHOLD) return "warning";
  return "danger";
}

function statusTextFor(kpi: KpiState, status: KpiStatus): string {
  const pctText = `${Math.max(0, Math.round(kpi.achievementRate * 100))}%`;

  switch (kpi.definition.category) {
    case "competency-fill":
    case "project-completion":
      return status === "achieved" ? `${pctText} · 달성` : `${pctText} · 목표 100%`;
    case "activity-count":
      return status === "achieved"
        ? `${kpi.currentValue}건 · 달성`
        : `${kpi.currentValue}건 · 목표 ${kpi.definition.target}건`;
    case "quiz-score":
      return status === "achieved"
        ? `${kpi.currentValue.toFixed(1)}/5 · 달성`
        : `${kpi.currentValue.toFixed(1)}/5 · 목표 ${kpi.definition.target.toFixed(1)}/5`;
  }
}

export function buildKpiStatusRows(kpis: KpiState[]): KpiStatusRow[] {
  return kpis.map((kpi) => {
    const status = statusFor(kpi.achievementRate);
    return {
      kpiId: kpi.definition.id,
      kpiName: kpi.definition.name,
      category: kpi.definition.category,
      currentValue: kpi.currentValue,
      target: kpi.definition.target,
      achievementRate: kpi.achievementRate,
      status,
      statusText: statusTextFor(kpi, status),
    };
  });
}
