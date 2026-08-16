import type { KpiState } from "./types.js";

/** True only on the update that crosses a KPI from below target to at/above target — false both
 * before that point and on every later update, so a caller firing this once per recordProgress
 * call sends exactly one achievement notification per KPI. */
export function justReachedTarget(previous: KpiState, updated: KpiState): boolean {
  return previous.achievementRate < 1 && updated.achievementRate >= 1;
}
