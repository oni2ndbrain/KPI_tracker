import type { AchievementCandidate, AchievementExtractionClient } from "../../index.js";

/** Fixture-backed fake — returns a canned result keyed by source text, never calls a real LLM.
 * Register `[]` explicitly for text expected to yield no candidates — an unregistered text throws,
 * so a fixture/text mismatch fails the test loudly instead of silently reporting "no candidates". */
export function createFixtureAchievementExtractionClient(
  fixtures: Record<string, AchievementCandidate[]>,
): AchievementExtractionClient {
  return {
    async extract(sourceText) {
      const result = fixtures[sourceText];
      if (!result) throw new Error(`no fixture registered for source text: ${sourceText.slice(0, 40)}...`);
      return result;
    },
  };
}
