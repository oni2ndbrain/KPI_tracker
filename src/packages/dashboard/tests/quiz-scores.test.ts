import { describe, expect, test } from "vitest";
import type { QuizAnswerRecord } from "../../kpi-engine/index.js";
import { buildQuizCompetencyScores } from "../index.js";

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

describe("buildQuizCompetencyScores", () => {
  test("averages every recorded score for a competency", () => {
    const scores = buildQuizCompetencyScores([answer("포토공정", 4), answer("포토공정", 2)]);

    expect(scores).toEqual([{ competency: "포토공정", score: 3 }]);
  });

  test("includes every quizzed competency, not just target-company-required ones", () => {
    const scores = buildQuizCompetencyScores([answer("포토공정", 4), answer("자소서 작성", 5)]);

    expect(scores.map((s) => s.competency).sort()).toEqual(["자소서 작성", "포토공정"]);
  });

  test("returns nothing when no quiz has ever been answered", () => {
    expect(buildQuizCompetencyScores([])).toEqual([]);
  });
});
