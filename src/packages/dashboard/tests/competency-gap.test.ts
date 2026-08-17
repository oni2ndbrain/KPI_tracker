import { describe, expect, test } from "vitest";
import type { QuizAnswerRecord, TargetCompany } from "../../kpi-engine/index.js";
import { buildCompetencyGapPoints } from "../index.js";

function company(id: string, requiredCompetencies: string[], gap: string[]): TargetCompany {
  return {
    id,
    name: id,
    requiredCompetencies,
    deadline: "2026-09-04",
    gap,
    kpiId: `${id}-kpi`,
    applicationPeriod: null,
  };
}

function answer(competency: string, score: number): QuizAnswerRecord {
  return {
    id: `${competency}-${score}-${Math.random()}`,
    questionId: "q1",
    competency,
    questionPrompt: "prompt",
    answerText: "answer",
    score,
    referencesPersonalExperience: true,
    isStructured: true,
    answeredAt: "2026-08-10T00:00:00.000Z",
  };
}

describe("buildCompetencyGapPoints", () => {
  test("uses the average quiz score scaled to 0-100 when the competency has been quizzed", () => {
    const points = buildCompetencyGapPoints(
      [company("samsung", ["포토공정"], [])],
      [answer("포토공정", 4), answer("포토공정", 2)],
    );

    expect(points).toEqual([{ competency: "포토공정", requiredScore: 100, heldScore: 60 }]);
  });

  test("falls back to 0 for a flagged-gap competency with no quiz data", () => {
    const points = buildCompetencyGapPoints([company("samsung", ["품질관리"], ["품질관리"])], []);

    expect(points).toEqual([{ competency: "품질관리", requiredScore: 100, heldScore: 0 }]);
  });

  test("falls back to 100 for a not-in-gap competency with no quiz data", () => {
    const points = buildCompetencyGapPoints([company("samsung", ["식각공정"], [])], []);

    expect(points).toEqual([{ competency: "식각공정", requiredScore: 100, heldScore: 100 }]);
  });

  test("dedupes a competency required by more than one target company", () => {
    const points = buildCompetencyGapPoints(
      [company("samsung", ["포토공정"], []), company("sk-hynix", ["포토공정"], ["포토공정"])],
      [],
    );

    expect(points).toHaveLength(1);
  });

  test("returns nothing when no target companies are registered", () => {
    expect(buildCompetencyGapPoints([], [])).toEqual([]);
  });
});
