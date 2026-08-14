import { describe, expect, test } from "vitest";
import { buildJdExtractionPrompt, parseJdExtractionResponse } from "../index.js";
import { samsungProcessEngineerJdFixture } from "./fixtures/samsung-process-engineer-jd.js";

describe("buildJdExtractionPrompt", () => {
  test("includes the raw JD text so the model has the posting to extract from", () => {
    const prompt = buildJdExtractionPrompt(samsungProcessEngineerJdFixture.jdText);

    expect(prompt).toContain(samsungProcessEngineerJdFixture.jdText);
  });
});

describe("parseJdExtractionResponse", () => {
  test("parses a recorded LLM response into structured competencies and a deadline", () => {
    const result = parseJdExtractionResponse(samsungProcessEngineerJdFixture.rawResponse);

    expect(result).toEqual(samsungProcessEngineerJdFixture.expected);
  });

  test("rejects a response that isn't valid JSON", () => {
    expect(() => parseJdExtractionResponse("역량: 반도체 공정 이해")).toThrow();
  });

  test("rejects a response missing the competencies field", () => {
    expect(() => parseJdExtractionResponse(JSON.stringify({ deadline: "2026-09-30" }))).toThrow();
  });

  test("rejects a response missing the deadline field", () => {
    expect(() =>
      parseJdExtractionResponse(JSON.stringify({ competencies: ["반도체 공정 이해"] })),
    ).toThrow();
  });

  test("rejects a response whose competencies are not all strings", () => {
    expect(() =>
      parseJdExtractionResponse(JSON.stringify({ competencies: ["ok", 5], deadline: "2026-09-30" })),
    ).toThrow();
  });
});
