import { describe, expect, test } from "vitest";
import type { KpiState } from "../../kpi-engine/index.js";
import { buildStatTiles } from "../index.js";

function kpi(
  id: string,
  category: KpiState["definition"]["category"],
  currentValue: number,
  target: number,
): KpiState {
  return {
    definition: { id, name: id, category, target },
    history: [],
    currentValue,
    achievementRate: currentValue / target,
  };
}

describe("buildStatTiles", () => {
  test("averages achievementRate across competency-fill KPIs into a percentage", () => {
    const tiles = buildStatTiles([
      kpi("samsung", "competency-fill", 5, 8),
      kpi("sk-hynix", "competency-fill", 6, 10),
    ]);

    const tile = tiles.find((t) => t.category === "competency-fill");
    // (5/8 + 6/10) / 2 = 0.6125 -> 61%
    expect(tile?.valueText).toBe("61%");
  });

  test("sums currentValue across activity-count KPIs with a 건 unit", () => {
    const tiles = buildStatTiles([kpi("apply-2026-08", "activity-count", 3, 5)]);

    const tile = tiles.find((t) => t.category === "activity-count");
    expect(tile?.valueText).toBe("3건");
  });

  test("averages currentValue across project-completion KPIs as a percentage", () => {
    const tiles = buildStatTiles([kpi("ax-portfolio", "project-completion", 80, 100)]);

    const tile = tiles.find((t) => t.category === "project-completion");
    expect(tile?.valueText).toBe("80%");
  });

  test("averages currentValue across quiz-score KPIs as an x.x/5 score", () => {
    const tiles = buildStatTiles([kpi("quiz-avg", "quiz-score", 3.4, 5)]);

    const tile = tiles.find((t) => t.category === "quiz-score");
    expect(tile?.valueText).toBe("3.4/5");
  });

  test("shows 데이터 없음 for a category with no KPIs yet", () => {
    const tiles = buildStatTiles([]);

    expect(tiles.every((t) => t.valueText === "데이터 없음")).toBe(true);
  });

  test("always returns exactly one tile per category, in a fixed order", () => {
    const tiles = buildStatTiles([]);

    expect(tiles.map((t) => t.category)).toEqual([
      "competency-fill",
      "activity-count",
      "project-completion",
      "quiz-score",
    ]);
  });
});
