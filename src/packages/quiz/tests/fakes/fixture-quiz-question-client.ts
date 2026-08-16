import type { QuizQuestionCandidate, QuizQuestionGenerationClient } from "../../index.js";

/** Fixture-backed fake — returns a canned result keyed by the joined competency list, never calls a real LLM. */
export function createFixtureQuizQuestionClient(
  fixtures: Record<string, QuizQuestionCandidate[]>,
): QuizQuestionGenerationClient {
  return {
    async generate({ competencies }) {
      const key = competencies.join("|");
      const result = fixtures[key];
      if (!result) throw new Error(`no fixture registered for competencies: ${key}`);
      return result;
    },
  };
}
