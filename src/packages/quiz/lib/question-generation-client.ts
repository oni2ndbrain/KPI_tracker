import type { QuizQuestionGenerationInput } from "./question-generation.js";
import type { QuizQuestionCandidate } from "./types.js";

/** The narrow surface quiz depends on for turning required competencies + LLM Wiki notes into
 * question candidates. A production implementation calls an LLM and runs its response through
 * parseQuizQuestionResponse; tests use a fixture-backed fake — never a live call. */
export interface QuizQuestionGenerationClient {
  generate(input: QuizQuestionGenerationInput): Promise<QuizQuestionCandidate[]>;
}
