import type { QuizGradingResult } from "./types.js";

export interface QuizGradingInput {
  competency: string;
  questionPrompt: string;
  /** Already-transcribed text — voice-dictated (Windows built-in dictation) or typed, indistinguishable here. */
  answerText: string;
}

export function buildQuizGradingPrompt(input: QuizGradingInput): string {
  return [
    "다음은 역량 진단 퀴즈 문항과 그에 대한 답변이다. 답변을 1~5점으로 채점하라.",
    "채점 기준: (1) 본인 경험과 연관 지어 설명하는지, (2) 현상 → 후속 공정에 미치는 영향 → 원인 → 해결 방안 순으로 구조화되어 있는지.",
    "다음 JSON 형식으로만 답하라:",
    '{"score": number, "referencesPersonalExperience": boolean, "isStructured": boolean}',
    "",
    `역량: ${input.competency}`,
    `문항: ${input.questionPrompt}`,
    `답변: ${input.answerText}`,
  ].join("\n");
}

/** Parses a recorded LLM response into structured data. Never calls an LLM itself — production
 * code feeds this the raw text of a real call; tests feed it a recorded fixture response. */
export function parseQuizGradingResponse(rawResponse: string): QuizGradingResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawResponse);
  } catch {
    throw new Error(`quiz grading response is not valid JSON: ${rawResponse}`);
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("quiz grading response must be a JSON object");
  }

  const { score, referencesPersonalExperience, isStructured } = parsed as Record<string, unknown>;

  if (typeof score !== "number" || !Number.isInteger(score) || score < 1 || score > 5) {
    throw new Error('quiz grading response "score" must be an integer between 1 and 5');
  }
  if (typeof referencesPersonalExperience !== "boolean") {
    throw new Error('quiz grading response "referencesPersonalExperience" must be a boolean');
  }
  if (typeof isStructured !== "boolean") {
    throw new Error('quiz grading response "isStructured" must be a boolean');
  }

  return { score, referencesPersonalExperience, isStructured };
}
