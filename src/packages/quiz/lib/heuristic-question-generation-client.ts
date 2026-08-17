import type { QuizQuestionGenerationClient } from "./question-generation-client.js";
import type { QuizQuestionCandidate } from "./types.js";

// buildQuizQuestionPrompt's spec asks for 3-5 questions; capping at 5 keeps this heuristic's output
// shaped the same way even though — unlike the real client — it never has more source material to
// draw on than one question per competency.
const MAX_QUESTIONS = 5;

/** Deterministic, non-LLM question generation — one fixed-template question per required
 * competency (up to MAX_QUESTIONS), ignoring wikiNotes. A placeholder for the real LLM-backed
 * generator (buildQuizQuestionPrompt + parseQuizQuestionResponse) this client interface was
 * designed around. Wiring an actual LLM call is a separate concern left for a future ticket; this
 * keeps 퀴즈 시작 usable today. */
export function createHeuristicQuizQuestionGenerationClient(): QuizQuestionGenerationClient {
  return {
    async generate({ competencies }): Promise<QuizQuestionCandidate[]> {
      return competencies.slice(0, MAX_QUESTIONS).map((competency) => ({
        competency,
        prompt: `${competency}와 관련해 직접 경험한 사례를 현상 → 후속공정 영향 → 원인 → 해결 순서로 설명해주세요.`,
      }));
    },
  };
}
