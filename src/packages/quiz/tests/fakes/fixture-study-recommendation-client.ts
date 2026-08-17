import type { StudyRecommendation, StudyRecommendationClient } from "../../index.js";

/** Fixture-backed fake — returns a canned result keyed by competency, never calls a real LLM. */
export function createFixtureStudyRecommendationClient(
  fixtures: Record<string, StudyRecommendation>,
): StudyRecommendationClient {
  return {
    async recommend({ competency }) {
      const result = fixtures[competency];
      if (!result) throw new Error(`no fixture registered for competency: ${competency}`);
      return result;
    },
  };
}
