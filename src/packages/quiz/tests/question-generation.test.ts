import { describe, expect, test } from "vitest";
import { buildQuizQuestionPrompt, parseQuizQuestionResponse } from "../index.js";
import { spcQuizQuestionsFixture } from "./fixtures/spc-quiz-questions.js";

describe("buildQuizQuestionPrompt", () => {
  test("includes every required competency so the model knows what to probe", () => {
    const prompt = buildQuizQuestionPrompt(spcQuizQuestionsFixture.input);

    for (const competency of spcQuizQuestionsFixture.input.competencies) {
      expect(prompt).toContain(competency);
    }
  });

  test("includes every LLM Wiki note so questions can draw on what's already studied", () => {
    const prompt = buildQuizQuestionPrompt(spcQuizQuestionsFixture.input);

    for (const note of spcQuizQuestionsFixture.input.wikiNotes) {
      expect(prompt).toContain(note);
    }
  });
});

describe("parseQuizQuestionResponse", () => {
  test("parses a recorded LLM response into structured question candidates", () => {
    const result = parseQuizQuestionResponse(spcQuizQuestionsFixture.rawResponse);

    expect(result).toEqual(spcQuizQuestionsFixture.expected);
  });

  test("rejects a response that isn't valid JSON", () => {
    expect(() => parseQuizQuestionResponse("문항: SPC 관리도란 무엇인가요?")).toThrow();
  });

  test("rejects a response that isn't a JSON array", () => {
    expect(() =>
      parseQuizQuestionResponse(JSON.stringify({ competency: "a", prompt: "b" })),
    ).toThrow();
  });

  test("rejects a candidate missing the competency field", () => {
    expect(() =>
      parseQuizQuestionResponse(
        JSON.stringify([
          { prompt: "b" },
          { competency: "a", prompt: "c" },
          { competency: "a", prompt: "d" },
        ]),
      ),
    ).toThrow();
  });

  test("rejects a candidate missing the prompt field", () => {
    expect(() =>
      parseQuizQuestionResponse(
        JSON.stringify([
          { competency: "a" },
          { competency: "a", prompt: "c" },
          { competency: "a", prompt: "d" },
        ]),
      ),
    ).toThrow();
  });

  test("rejects fewer than 3 questions", () => {
    expect(() =>
      parseQuizQuestionResponse(
        JSON.stringify([
          { competency: "a", prompt: "b" },
          { competency: "a", prompt: "c" },
        ]),
      ),
    ).toThrow();
  });

  test("rejects more than 5 questions", () => {
    const sixQuestions = Array.from({ length: 6 }, (_, index) => ({ competency: "a", prompt: `q${index}` }));

    expect(() => parseQuizQuestionResponse(JSON.stringify(sixQuestions))).toThrow();
  });
});
