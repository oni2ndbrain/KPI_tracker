import { describe, expect, test } from "vitest";
import { computeWeakItems, isWrongAnswer, outstandingWrongQuestions } from "../index.js";
import type { QuizAnswerRecord } from "../index.js";

function answer(overrides: Partial<QuizAnswerRecord> & { questionId: string; competency: string; score: number; answeredAt: string }): QuizAnswerRecord {
  return {
    id: `${overrides.questionId}@${overrides.answeredAt}`,
    questionPrompt: "문항",
    answerText: "답변",
    referencesPersonalExperience: false,
    isStructured: false,
    ...overrides,
  };
}

describe("isWrongAnswer", () => {
  test("scores below 3 count as wrong", () => {
    expect(isWrongAnswer(answer({ questionId: "q0", competency: "SPC", score: 1, answeredAt: "t1" }))).toBe(true);
    expect(isWrongAnswer(answer({ questionId: "q0", competency: "SPC", score: 2, answeredAt: "t1" }))).toBe(true);
  });

  test("scores of 3 or above count as correct", () => {
    expect(isWrongAnswer(answer({ questionId: "q0", competency: "SPC", score: 3, answeredAt: "t1" }))).toBe(false);
    expect(isWrongAnswer(answer({ questionId: "q0", competency: "SPC", score: 5, answeredAt: "t1" }))).toBe(false);
  });
});

describe("computeWeakItems", () => {
  test("marks a competency weak once its two most recent answers are both wrong", () => {
    const answers = [
      answer({ questionId: "q0", competency: "SPC", score: 2, answeredAt: "2026-08-01T00:00:00.000Z" }),
      answer({ questionId: "q1", competency: "SPC", score: 1, answeredAt: "2026-08-02T00:00:00.000Z" }),
    ];

    expect(computeWeakItems(answers)).toEqual([{ competency: "SPC", consecutiveWrongCount: 2 }]);
  });

  test("does not mark a competency weak from a single wrong answer", () => {
    const answers = [answer({ questionId: "q0", competency: "SPC", score: 2, answeredAt: "2026-08-01T00:00:00.000Z" })];

    expect(computeWeakItems(answers)).toEqual([]);
  });

  test("a correct answer resets the streak, even after prior wrong answers", () => {
    const answers = [
      answer({ questionId: "q0", competency: "SPC", score: 1, answeredAt: "2026-08-01T00:00:00.000Z" }),
      answer({ questionId: "q1", competency: "SPC", score: 1, answeredAt: "2026-08-02T00:00:00.000Z" }),
      answer({ questionId: "q2", competency: "SPC", score: 4, answeredAt: "2026-08-03T00:00:00.000Z" }),
    ];

    expect(computeWeakItems(answers)).toEqual([]);
  });

  test("evaluates the streak in answeredAt order, not array order", () => {
    const answers = [
      answer({ questionId: "q1", competency: "SPC", score: 1, answeredAt: "2026-08-02T00:00:00.000Z" }),
      answer({ questionId: "q0", competency: "SPC", score: 4, answeredAt: "2026-08-01T00:00:00.000Z" }),
    ];

    // Chronologically: correct then wrong — only a streak of 1, not weak yet.
    expect(computeWeakItems(answers)).toEqual([]);
  });

  test("tracks each competency's streak independently", () => {
    const answers = [
      answer({ questionId: "q0", competency: "SPC", score: 1, answeredAt: "2026-08-01T00:00:00.000Z" }),
      answer({ questionId: "q1", competency: "SPC", score: 1, answeredAt: "2026-08-02T00:00:00.000Z" }),
      answer({ questionId: "q2", competency: "6시그마", score: 5, answeredAt: "2026-08-01T00:00:00.000Z" }),
    ];

    expect(computeWeakItems(answers)).toEqual([{ competency: "SPC", consecutiveWrongCount: 2 }]);
  });

  test("a longer wrong streak is reported in full", () => {
    const answers = [
      answer({ questionId: "q0", competency: "SPC", score: 1, answeredAt: "2026-08-01T00:00:00.000Z" }),
      answer({ questionId: "q1", competency: "SPC", score: 2, answeredAt: "2026-08-02T00:00:00.000Z" }),
      answer({ questionId: "q2", competency: "SPC", score: 1, answeredAt: "2026-08-03T00:00:00.000Z" }),
    ];

    expect(computeWeakItems(answers)).toEqual([{ competency: "SPC", consecutiveWrongCount: 3 }]);
  });
});

describe("outstandingWrongQuestions", () => {
  test("includes a question whose only attempt was wrong", () => {
    const answers = [
      answer({
        questionId: "q0",
        competency: "SPC",
        score: 2,
        answeredAt: "2026-08-01T00:00:00.000Z",
        questionPrompt: "SPC 이상점 대응은?",
      }),
    ];

    expect(outstandingWrongQuestions(answers)).toEqual([
      { id: "q0", competency: "SPC", prompt: "SPC 이상점 대응은?" },
    ]);
  });

  test("excludes a question whose latest attempt was correct", () => {
    const answers = [
      answer({ questionId: "q0", competency: "SPC", score: 1, answeredAt: "2026-08-01T00:00:00.000Z" }),
      answer({ questionId: "q0", competency: "SPC", score: 4, answeredAt: "2026-08-02T00:00:00.000Z" }),
    ];

    expect(outstandingWrongQuestions(answers)).toEqual([]);
  });

  test("uses only the latest attempt per question, regardless of array order", () => {
    const answers = [
      answer({ questionId: "q0", competency: "SPC", score: 4, answeredAt: "2026-08-02T00:00:00.000Z" }),
      answer({ questionId: "q0", competency: "SPC", score: 1, answeredAt: "2026-08-01T00:00:00.000Z" }),
    ];

    expect(outstandingWrongQuestions(answers)).toEqual([]);
  });
});
