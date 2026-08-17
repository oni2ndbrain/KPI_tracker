import { describe, expect, test } from "vitest";
import { createHeuristicStudyRecommendationClient } from "../index.js";

describe("createHeuristicStudyRecommendationClient", () => {
  test("recommends the LLM Wiki note when one mentions the competency", async () => {
    const client = createHeuristicStudyRecommendationClient();

    const recommendation = await client.recommend({
      competency: "SPC",
      wikiNotes: ["2026-07 노트: SPC 관리도 정리", "다른 노트"],
    });

    expect(recommendation.source).toBe("llm-wiki");
    expect(recommendation.reference).toContain("SPC");
  });

  test("falls back to a web-search recommendation when no note mentions it", async () => {
    const client = createHeuristicStudyRecommendationClient();

    const recommendation = await client.recommend({ competency: "SPC", wikiNotes: ["관련 없는 노트"] });

    expect(recommendation.source).toBe("web-search");
    expect(recommendation.title).toContain("SPC");
  });
});
