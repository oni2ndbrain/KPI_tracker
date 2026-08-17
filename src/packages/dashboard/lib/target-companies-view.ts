import { daysUntil } from "../../kpi-engine/index.js";
import type { KpiState, TargetCompany } from "../../kpi-engine/index.js";
import type { DeadlineUrgency, TargetCompanyRow } from "./types.js";

// Calibrated against the mockup's own worked example — docs/design/kpi-dashboard-mockup.html
// lines 106-107 render "삼성전자 · D-18" as danger and "SK하이닉스 · D-42" as warning.
const DANGER_WITHIN_DAYS = 20;
const WARNING_WITHIN_DAYS = 45;

function urgencyFor(daysUntilDeadline: number): DeadlineUrgency {
  if (daysUntilDeadline <= DANGER_WITHIN_DAYS) return "danger";
  if (daysUntilDeadline <= WARNING_WITHIN_DAYS) return "warning";
  return "neutral";
}

/** Sorted soonest-deadline-first, so the most urgent target company is always the first row. */
export function buildTargetCompanyRows(
  companies: TargetCompany[],
  kpis: KpiState[],
  today: string,
): TargetCompanyRow[] {
  const kpiById = new Map(kpis.map((kpi) => [kpi.definition.id, kpi]));

  return companies
    .map((company) => {
      const daysUntilDeadline = daysUntil(today, company.deadline);
      const linkedKpi = kpiById.get(company.kpiId);
      return {
        id: company.id,
        name: company.name,
        deadline: company.deadline,
        daysUntilDeadline,
        urgency: urgencyFor(daysUntilDeadline),
        progressRate: linkedKpi ? Math.max(0, Math.min(1, linkedKpi.achievementRate)) : 0,
        gap: company.gap,
      };
    })
    .sort((a, b) => a.daysUntilDeadline - b.daysUntilDeadline);
}
