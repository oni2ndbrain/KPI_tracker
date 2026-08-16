import type { QuizGradingInput } from "./grading.js";
import type { QuizGradingResult } from "./types.js";

/** The narrow surface quiz depends on for scoring a text answer against the grading rubric.
 * A production implementation calls an LLM and runs its response through parseQuizGradingResponse;
 * tests use a fixture-backed fake — never a live call. */
export interface QuizGradingClient {
  grade(input: QuizGradingInput): Promise<QuizGradingResult>;
}
