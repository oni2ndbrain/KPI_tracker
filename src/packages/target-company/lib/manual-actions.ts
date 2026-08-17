import { createKpi, recordProgress } from "../../kpi-engine/index.js";
import type { KpiState, TargetCompany } from "../../kpi-engine/index.js";
import type { KpiStorage, TargetCompanyStorage } from "../../kpi-storage/index.js";

// Mirrors the id/name/target convention already established across kpi-engine/kpi-storage/
// report-renderer's tests (e.g. "apply-count-2026-08" / "이번 달 지원 건수" / target 5) — one KPI
// per calendar month, matching the mockup's "지원 건수 · 3건 · 목표 5건" tile.
const APPLICATION_COUNT_KPI_NAME = "이번 달 지원 건수";
const APPLICATION_COUNT_KPI_TARGET = 5;

function applicationCountKpiIdFor(yearMonth: string): string {
  return `apply-count-${yearMonth}`;
}

export interface MarkApplicationCompleteDeps {
  targetCompanyStorage: TargetCompanyStorage;
  kpiStorage: KpiStorage;
}

/** Marks a target company as applied to (관리 화면's "지원 완료" check) and folds it into that
 * calendar month's 지원 건수 KPI. Idempotent — checking an already-applied company again returns
 * it unchanged instead of double-counting. */
export async function markApplicationComplete(
  deps: MarkApplicationCompleteDeps,
  companyId: string,
  appliedAt: string,
): Promise<TargetCompany> {
  const companies = await deps.targetCompanyStorage.list();
  const company = companies.find((c) => c.id === companyId);
  if (!company) {
    throw new Error(`no target company registered with id "${companyId}"`);
  }
  if (company.appliedAt) {
    return company;
  }

  const updated: TargetCompany = { ...company, appliedAt };
  await deps.targetCompanyStorage.save(updated);

  const kpiId = applicationCountKpiIdFor(appliedAt.slice(0, 7));
  const kpi =
    (await deps.kpiStorage.load(kpiId)) ??
    createKpi({ id: kpiId, name: APPLICATION_COUNT_KPI_NAME, category: "activity-count", target: APPLICATION_COUNT_KPI_TARGET });
  await deps.kpiStorage.save(recordProgress(kpi, { category: "activity-count", amount: 1 }));

  return updated;
}

export interface AdjustCompetencyScoreDeps {
  kpiStorage: KpiStorage;
}

/** Applies a manual +/- adjustment to a target company's 역량 채우기 KPI, entered directly in the
 * 관리 화면 — the same delta-based progress event a quiz's wrong-answer correction uses (see
 * quiz-session.ts's COMPETENCY_FILL_WRONG_CORRECTION), just user-driven instead of automatic. */
export async function adjustCompetencyScore(
  deps: AdjustCompetencyScoreDeps,
  kpiId: string,
  amount: number,
): Promise<KpiState> {
  const kpi = await deps.kpiStorage.load(kpiId);
  if (!kpi) {
    throw new Error(`no KPI found with id "${kpiId}"`);
  }
  const updated = recordProgress(kpi, { category: "competency-fill", amount });
  await deps.kpiStorage.save(updated);
  return updated;
}
