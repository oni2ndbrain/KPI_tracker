import { daysBetween } from "./date-math.js";
import { proposalMessageFor, remainingToTarget } from "./report-fact.js";
import type { KpiState } from "./types.js";

const DEADLINE_CHECKPOINTS = [14, 7, 1] as const;
export type DeadlineCheckpoint = (typeof DEADLINE_CHECKPOINTS)[number];

export interface DeadlineAlertInput {
  targetCompanyName: string;
  /** ISO date (YYYY-MM-DD) — the target company's application deadline. */
  deadline: string;
  kpi: KpiState;
  /** Required competencies not yet covered, as of this target company's own most recent gap
   * analysis — used to name specific next steps instead of just a remaining count. Pass an empty
   * array if no gap analysis is available. */
  gap: string[];
  /** ISO date (YYYY-MM-DD) — "today", passed in rather than read from the clock so callers stay
   * deterministic and testable. */
  today: string;
  generatedAt?: string;
}

export interface DeadlineAlertData {
  targetCompanyName: string;
  kpiName: string;
  deadline: string;
  daysUntilDeadline: DeadlineCheckpoint;
  achievementRate: number;
  actionMessage: string;
  generatedAt: string;
}

function daysUntilDeadline(today: string, deadline: string): number {
  return Math.round(daysBetween(today, deadline));
}

/** True only on a D-14/D-7/D-1 checkpoint day while the KPI is still behind target — false on
 * every other day, and false once the KPI has caught up, even on a checkpoint day. */
export function shouldSendDeadlineAlert(input: DeadlineAlertInput): boolean {
  const days = daysUntilDeadline(input.today, input.deadline);
  return (DEADLINE_CHECKPOINTS as readonly number[]).includes(days) && input.kpi.achievementRate < 1;
}

function actionMessageFor(input: DeadlineAlertInput): string {
  if (input.gap.length === 0) {
    return proposalMessageFor(input.kpi.definition.category, input.kpi.definition.name, remainingToTarget(input.kpi));
  }

  const [first, ...rest] = input.gap;
  const gapList = rest.length > 0 ? `${first} 외 ${rest.length}개` : first;
  return `${input.kpi.definition.name}: 아직 부족한 역량은 ${gapList}예요. ${first}부터 시작해보세요.`;
}

export function buildDeadlineAlertData(input: DeadlineAlertInput): DeadlineAlertData {
  const days = daysUntilDeadline(input.today, input.deadline) as DeadlineCheckpoint;

  return {
    targetCompanyName: input.targetCompanyName,
    kpiName: input.kpi.definition.name,
    deadline: input.deadline,
    daysUntilDeadline: days,
    achievementRate: input.kpi.achievementRate,
    actionMessage: `D-${days}! ${actionMessageFor(input)}`,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
  };
}
