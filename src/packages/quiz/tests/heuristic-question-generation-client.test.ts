import { describe, expect, test } from "vitest";
import { createHeuristicQuizQuestionGenerationClient } from "../index.js";

describe("createHeuristicQuizQuestionGenerationClient", () => {
  test("generates one question per competency", async () => {
    const client = createHeuristicQuizQuestionGenerationClient();

    const candidates = await client.generate({ competencies: ["SPC", "품질관리"], wikiNotes: [] });

    expect(candidates.map((c) => c.competency)).toEqual(["SPC", "품질관리"]);
    expect(candidates.every((c) => c.prompt.length > 0)).toBe(true);
  });

  test("caps at 5 questions even with more competencies", async () => {
    const client = createHeuristicQuizQuestionGenerationClient();

    const candidates = await client.generate({
      competencies: ["a", "b", "c", "d", "e", "f", "g"],
      wikiNotes: [],
    });

    expect(candidates).toHaveLength(5);
  });
});
