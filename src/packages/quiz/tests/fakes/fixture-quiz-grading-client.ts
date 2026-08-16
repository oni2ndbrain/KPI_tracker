import type { QuizGradingClient, QuizGradingResult } from "../../index.js";

/** Fixture-backed fake — returns a canned result keyed by answer text, never calls a real LLM. */
export function createFixtureQuizGradingClient(
  fixtures: Record<string, QuizGradingResult>,
): QuizGradingClient {
  return {
    async grade({ answerText }) {
      const result = fixtures[answerText];
      if (!result) throw new Error(`no fixture registered for answer text: ${answerText.slice(0, 40)}...`);
      return result;
    },
  };
}
