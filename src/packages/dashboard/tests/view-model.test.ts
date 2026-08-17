import { describe, expect, test } from "vitest";
import type { KpiState, TargetCompany } from "../../kpi-engine/index.js";
import { buildDashboardViewModel } from "../index.js";

function kpi(id: string, achievementRate: number): KpiState {
  return {
    definition: { id, name: id, category: "competency-fill", target: 100 },
    history: [],
    currentValue: achievementRate * 100,
    achievementRate,
  };
}

function company(id: string, kpiId: string): TargetCompany {
  return {
    id,
    name: id,
    requiredCompetencies: [],
    deadline: "2026-09-04",
    gap: [],
    kpiId,
    applicationPeriod: null,
  };
}

describe("buildDashboardViewModel", () => {
  test("assembles every section from the same underlying KPI/target-company/quiz data", () => {
    const model = buildDashboardViewModel({
      kpis: [kpi("samsung-kpi", 0.62)],
      targetCompanies: [company("samsung", "samsung-kpi")],
      quizAnswers: [],
      lastQuizAt: null,
      today: "2026-08-17",
    });

    expect(model.statTiles).toHaveLength(4);
    expect(model.kpiRows).toHaveLength(1);
    expect(model.targetCompanies).toHaveLength(1);
    expect(model.targetCompanies[0]?.progressRate).toBe(0.62);
    expect(model.definitions["competency-fill"].categoryLabel).toBe("역량 채우기");
  });

  test("derives daysSinceLastQuiz from lastQuizAt via the same logic as the quiz-inactivity alert", () => {
    const model = buildDashboardViewModel({
      kpis: [],
      targetCompanies: [],
      quizAnswers: [],
      lastQuizAt: "2026-08-08T00:00:00.000Z",
      today: "2026-08-17",
    });

    expect(model.daysSinceLastQuiz).toBe(9);
  });

  test("daysSinceLastQuiz is null when no quiz has ever been taken", () => {
    const model = buildDashboardViewModel({
      kpis: [],
      targetCompanies: [],
      quizAnswers: [],
      lastQuizAt: null,
      today: "2026-08-17",
    });

    expect(model.daysSinceLastQuiz).toBeNull();
  });

  test("defaults generatedAt to now when not supplied", () => {
    const model = buildDashboardViewModel({
      kpis: [],
      targetCompanies: [],
      quizAnswers: [],
      lastQuizAt: null,
      today: "2026-08-17",
    });

    expect(() => new Date(model.generatedAt).toISOString()).not.toThrow();
  });
});
