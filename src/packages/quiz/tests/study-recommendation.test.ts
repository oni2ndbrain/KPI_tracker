import { describe, expect, test } from "vitest";
import { buildStudyRecommendationPrompt, parseStudyRecommendationResponse } from "../index.js";
import { spcStudyRecommendationFixture } from "./fixtures/spc-study-recommendation.js";

describe("buildStudyRecommendationPrompt", () => {
  test("includes the competency and the wiki notes", () => {
    const prompt = buildStudyRecommendationPrompt(spcStudyRecommendationFixture.input);

    expect(prompt).toContain(spcStudyRecommendationFixture.input.competency);
    expect(prompt).toContain(spcStudyRecommendationFixture.input.wikiNotes[0]);
  });
});

describe("parseStudyRecommendationResponse", () => {
  test("parses a recorded LLM response into a structured recommendation", () => {
    const result = parseStudyRecommendationResponse(spcStudyRecommendationFixture.rawResponse);

    expect(result).toEqual(spcStudyRecommendationFixture.expected);
  });

  test("rejects a response that isn't valid JSON", () => {
    expect(() => parseStudyRecommendationResponse("추천: SPC 노트")).toThrow();
  });

  test("rejects a response whose source isn't llm-wiki or web-search", () => {
    expect(() =>
      parseStudyRecommendationResponse(JSON.stringify({ source: "textbook", title: "t", reference: "r" })),
    ).toThrow();
  });

  test("rejects a response missing the title field", () => {
    expect(() =>
      parseStudyRecommendationResponse(JSON.stringify({ source: "web-search", reference: "r" })),
    ).toThrow();
  });

  test("rejects a response missing the reference field", () => {
    expect(() =>
      parseStudyRecommendationResponse(JSON.stringify({ source: "web-search", title: "t" })),
    ).toThrow();
  });
});
