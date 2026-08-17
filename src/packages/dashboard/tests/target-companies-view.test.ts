import { describe, expect, test } from "vitest";
import type { KpiState, TargetCompany } from "../../kpi-engine/index.js";
import { buildTargetCompanyRows } from "../index.js";

function company(id: string, name: string, deadline: string, kpiId: string, gap: string[] = []): TargetCompany {
  return { id, name, requiredCompetencies: [], deadline, gap, kpiId, applicationPeriod: null };
}

function kpi(id: string, achievementRate: number): KpiState {
  return {
    definition: { id, name: id, category: "competency-fill", target: 100 },
    history: [],
    currentValue: achievementRate * 100,
    achievementRate,
  };
}

const TODAY = "2026-08-17";

describe("buildTargetCompanyRows", () => {
  test("computes days-until-deadline from today", () => {
    const [row] = buildTargetCompanyRows(
      [company("samsung", "삼성전자", "2026-09-04", "samsung-kpi")],
      [kpi("samsung-kpi", 0.62)],
      TODAY,
    );
    expect(row?.daysUntilDeadline).toBe(18);
  });

  test("marks a deadline inside 14 days as danger", () => {
    const [row] = buildTargetCompanyRows(
      [company("a", "A사", "2026-08-25", "a-kpi")],
      [kpi("a-kpi", 0.5)],
      TODAY,
    );
    expect(row?.urgency).toBe("danger");
  });

  test("marks a deadline inside 30 days but past 14 as warning", () => {
    const [row] = buildTargetCompanyRows(
      [company("b", "B사", "2026-09-10", "b-kpi")],
      [kpi("b-kpi", 0.5)],
      TODAY,
    );
    expect(row?.urgency).toBe("warning");
  });

  test("marks a distant deadline as neutral", () => {
    const [row] = buildTargetCompanyRows(
      [company("c", "C사", "2026-12-01", "c-kpi")],
      [kpi("c-kpi", 0.5)],
      TODAY,
    );
    expect(row?.urgency).toBe("neutral");
  });

  test("pulls progress from the linked competency-fill KPI's achievementRate", () => {
    const [row] = buildTargetCompanyRows(
      [company("samsung", "삼성전자", "2026-09-04", "samsung-kpi")],
      [kpi("samsung-kpi", 0.62)],
      TODAY,
    );
    expect(row?.progressRate).toBe(0.62);
  });

  test("defaults progress to 0 when the linked KPI can't be found", () => {
    const [row] = buildTargetCompanyRows(
      [company("orphan", "고아사", "2026-09-04", "missing-kpi")],
      [],
      TODAY,
    );
    expect(row?.progressRate).toBe(0);
  });

  test("sorts soonest deadline first", () => {
    const rows = buildTargetCompanyRows(
      [
        company("far", "먼회사", "2026-12-01", "far-kpi"),
        company("near", "가까운회사", "2026-08-25", "near-kpi"),
      ],
      [kpi("far-kpi", 0.5), kpi("near-kpi", 0.5)],
      TODAY,
    );
    expect(rows.map((r) => r.id)).toEqual(["near", "far"]);
  });

  test("passes through the gap list unchanged", () => {
    const [row] = buildTargetCompanyRows(
      [company("samsung", "삼성전자", "2026-09-04", "samsung-kpi", ["포토공정", "품질관리"])],
      [kpi("samsung-kpi", 0.62)],
      TODAY,
    );
    expect(row?.gap).toEqual(["포토공정", "품질관리"]);
  });
});
