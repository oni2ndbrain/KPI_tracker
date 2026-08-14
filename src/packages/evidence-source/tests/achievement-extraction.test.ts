import { describe, expect, test } from "vitest";
import { buildAchievementExtractionPrompt, parseAchievementExtractionResponse } from "../index.js";
import { processImprovementNoteFixture } from "./fixtures/process-improvement-note.js";

describe("buildAchievementExtractionPrompt", () => {
  test("includes the raw source text so the model has the note/document to extract from", () => {
    const prompt = buildAchievementExtractionPrompt(processImprovementNoteFixture.sourceText);

    expect(prompt).toContain(processImprovementNoteFixture.sourceText);
  });
});

describe("parseAchievementExtractionResponse", () => {
  test("parses a recorded LLM response into structured achievement candidates", () => {
    const result = parseAchievementExtractionResponse(processImprovementNoteFixture.rawResponse);

    expect(result).toEqual(processImprovementNoteFixture.expected);
  });

  test("an empty array response means no achievement candidates were found", () => {
    expect(parseAchievementExtractionResponse("[]")).toEqual([]);
  });

  test("rejects a response that isn't valid JSON", () => {
    expect(() => parseAchievementExtractionResponse("성과: 수율 개선")).toThrow();
  });

  test("rejects a response that isn't a JSON array", () => {
    expect(() => parseAchievementExtractionResponse(JSON.stringify({ title: "x" }))).toThrow();
  });

  test("rejects a candidate missing the title field", () => {
    expect(() =>
      parseAchievementExtractionResponse(JSON.stringify([{ description: "설명만 있음" }])),
    ).toThrow();
  });

  test("rejects a candidate missing the description field", () => {
    expect(() =>
      parseAchievementExtractionResponse(JSON.stringify([{ title: "제목만 있음" }])),
    ).toThrow();
  });
});
