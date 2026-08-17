import { describe, expect, test } from "vitest";
import type { KpiState } from "../../kpi-engine/index.js";
import { buildKpiStatusRows } from "../index.js";

function kpi(
  id: string,
  category: KpiState["definition"]["category"],
  currentValue: number,
  target: number,
): KpiState {
  return {
    definition: { id, name: `${id}-name`, category, target },
    history: [],
    currentValue,
    achievementRate: currentValue / target,
  };
}

describe("buildKpiStatusRows", () => {
  test("marks a fully-met KPI as achieved", () => {
    const [row] = buildKpiStatusRows([kpi("etch", "competency-fill", 8, 8)]);
    expect(row?.status).toBe("achieved");
    expect(row?.statusText).toBe("100% · 달성");
  });

  test("marks a KPI just under target as warning, not danger", () => {
    const [row] = buildKpiStatusRows([kpi("ax", "project-completion", 80, 100)]);
    expect(row?.status).toBe("warning");
    expect(row?.statusText).toBe("80% · 목표 100%");
  });

  test("marks a KPI well under target as danger", () => {
    const [row] = buildKpiStatusRows([kpi("photo", "competency-fill", 62, 100)]);
    expect(row?.status).toBe("danger");
    expect(row?.statusText).toBe("62% · 목표 100%");
  });

  test("renders activity-count in raw units, not percentages", () => {
    const [row] = buildKpiStatusRows([kpi("apply-2026-08", "activity-count", 3, 5)]);
    expect(row?.statusText).toBe("3건 · 목표 5건");
  });

  test("renders quiz-score out of 5", () => {
    const [row] = buildKpiStatusRows([kpi("quiz-avg", "quiz-score", 3.4, 4)]);
    expect(row?.statusText).toBe("3.4/5 · 목표 4.0/5");
  });

  test("preserves KPI id/name/category for click-through to the indicator definition", () => {
    const [row] = buildKpiStatusRows([kpi("etch", "competency-fill", 8, 8)]);
    expect(row).toMatchObject({ kpiId: "etch", kpiName: "etch-name", category: "competency-fill" });
  });
});
