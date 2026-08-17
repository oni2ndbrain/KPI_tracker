import { describe, expect, test } from "vitest";
import type { KpiCategory } from "../../kpi-engine/index.js";
import { allDefinitions } from "../index.js";

const CATEGORIES: KpiCategory[] = ["competency-fill", "activity-count", "project-completion", "quiz-score"];

describe("allDefinitions", () => {
  test("has one non-empty definition for every KPI category", () => {
    const definitions = allDefinitions();

    for (const category of CATEGORIES) {
      const definition = definitions[category];
      expect(definition.category).toBe(category);
      expect(definition.categoryLabel.length).toBeGreaterThan(0);
      expect(definition.formula.length).toBeGreaterThan(0);
      expect(definition.dataSource.length).toBeGreaterThan(0);
      expect(definition.aggregationCadence.length).toBeGreaterThan(0);
      expect(definition.relatedKpis.length).toBeGreaterThan(0);
    }
  });
});
