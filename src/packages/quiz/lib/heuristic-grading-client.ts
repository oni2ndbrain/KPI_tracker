import type { QuizGradingClient } from "./grading-client.js";
import type { QuizGradingResult } from "./types.js";

const PERSONAL_EXPERIENCE_MARKERS = ["제가", "저는", "제 경험", "당시", "진행하며", "담당했", "프로젝트에서"];
const STRUCTURE_MARKERS = ["원인", "해결", "영향", "후속"];
const MIN_STRUCTURE_MARKERS = 2;
const SUBSTANTIAL_ANSWER_LENGTH = 20;

/** Deterministic, non-LLM grading — keyword-matches the same two rubric dimensions the real
 * grader is meant to judge (경험 연관, 현상→후속공정영향→원인→해결 구조화) instead of asking an
 * LLM to judge them. A placeholder for the real LLM-backed grader (buildQuizGradingPrompt +
 * parseQuizGradingResponse) this client interface was designed around. Wiring an actual LLM call
 * is a separate concern left for a future ticket; this keeps 퀴즈 결과 반영 usable today. */
export function createHeuristicQuizGradingClient(): QuizGradingClient {
  return {
    async grade({ answerText }): Promise<QuizGradingResult> {
      const referencesPersonalExperience = PERSONAL_EXPERIENCE_MARKERS.some((marker) => answerText.includes(marker));
      const structureHits = STRUCTURE_MARKERS.filter((marker) => answerText.includes(marker)).length;
      const isStructured = structureHits >= MIN_STRUCTURE_MARKERS;

      let score = 1;
      if (answerText.trim().length >= SUBSTANTIAL_ANSWER_LENGTH) score += 1;
      if (referencesPersonalExperience) score += 1;
      if (isStructured) score += 2;

      return { score: Math.min(5, score), referencesPersonalExperience, isStructured };
    },
  };
}
