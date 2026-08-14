import type { LlmWikiSearch } from "../../index.js";

/** In-memory stand-in for the LLM Wiki — treats a fixed set of competencies as already covered. */
export function createFakeLlmWikiSearch(coveredCompetencies: string[]): LlmWikiSearch {
  const covered = new Set(coveredCompetencies);
  return {
    async covered(competencies) {
      return competencies.filter((competency) => covered.has(competency));
    },
  };
}
