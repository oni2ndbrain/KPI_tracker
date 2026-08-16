import { describe, expect, test } from "vitest";
import { buildQuizGradingPrompt, parseQuizGradingResponse } from "../index.js";
import { spcAnswerGradingFixture } from "./fixtures/spc-answer-grading.js";

describe("buildQuizGradingPrompt", () => {
  test("includes the competency, question prompt, and answer text", () => {
    const prompt = buildQuizGradingPrompt(spcAnswerGradingFixture.input);

    expect(prompt).toContain(spcAnswerGradingFixture.input.competency);
    expect(prompt).toContain(spcAnswerGradingFixture.input.questionPrompt);
    expect(prompt).toContain(spcAnswerGradingFixture.input.answerText);
  });
});

describe("parseQuizGradingResponse", () => {
  test("parses a recorded LLM response into a structured grading result", () => {
    const result = parseQuizGradingResponse(spcAnswerGradingFixture.rawResponse);

    expect(result).toEqual(spcAnswerGradingFixture.expected);
  });

  test("rejects a response that isn't valid JSON", () => {
    expect(() => parseQuizGradingResponse("점수: 5점")).toThrow();
  });

  test("rejects a response missing the score field", () => {
    expect(() =>
      parseQuizGradingResponse(JSON.stringify({ referencesPersonalExperience: true, isStructured: true })),
    ).toThrow();
  });

  test("rejects a non-integer score", () => {
    expect(() =>
      parseQuizGradingResponse(
        JSON.stringify({ score: 3.5, referencesPersonalExperience: true, isStructured: true }),
      ),
    ).toThrow();
  });

  test("rejects a score below 1", () => {
    expect(() =>
      parseQuizGradingResponse(
        JSON.stringify({ score: 0, referencesPersonalExperience: true, isStructured: true }),
      ),
    ).toThrow();
  });

  test("rejects a score above 5", () => {
    expect(() =>
      parseQuizGradingResponse(
        JSON.stringify({ score: 6, referencesPersonalExperience: true, isStructured: true }),
      ),
    ).toThrow();
  });

  test("rejects a response whose referencesPersonalExperience is not a boolean", () => {
    expect(() =>
      parseQuizGradingResponse(JSON.stringify({ score: 4, referencesPersonalExperience: "yes", isStructured: true })),
    ).toThrow();
  });

  test("rejects a response whose isStructured is not a boolean", () => {
    expect(() =>
      parseQuizGradingResponse(JSON.stringify({ score: 4, referencesPersonalExperience: true, isStructured: "yes" })),
    ).toThrow();
  });
});
