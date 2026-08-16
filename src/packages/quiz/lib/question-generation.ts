import type { QuizQuestionCandidate } from "./types.js";

const MIN_QUESTIONS = 3;
const MAX_QUESTIONS = 5;

export interface QuizQuestionGenerationInput {
  /** Required competencies to probe, typically a target company's requiredCompetencies. */
  competencies: string[];
  /** Raw LLM Wiki note/conversation text the questions should draw on alongside the competencies. */
  wikiNotes: string[];
}

export function buildQuizQuestionPrompt(input: QuizQuestionGenerationInput): string {
  return [
    "다음은 목표 회사가 요구하는 역량 목록과, 지금까지 정리해둔 LLM Wiki 기술 노트이다.",
    `이 역량과 노트를 함께 참고해 역량 진단 퀴즈 문항을 ${MIN_QUESTIONS}~${MAX_QUESTIONS}개 생성하라.`,
    "다음 JSON 형식으로만 답하라:",
    '[{"competency": string, "prompt": string}]',
    "",
    "요구 역량:",
    input.competencies.join(", "),
    "",
    "LLM Wiki 기술 노트:",
    input.wikiNotes.join("\n---\n"),
  ].join("\n");
}

/** Parses a recorded LLM response into structured data. Never calls an LLM itself — production
 * code feeds this the raw text of a real call; tests feed it a recorded fixture response. */
export function parseQuizQuestionResponse(rawResponse: string): QuizQuestionCandidate[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawResponse);
  } catch {
    throw new Error(`quiz question generation response is not valid JSON: ${rawResponse}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error("quiz question generation response must be a JSON array");
  }

  const questions = parsed.map((candidate, index): QuizQuestionCandidate => {
    if (typeof candidate !== "object" || candidate === null) {
      throw new Error(`quiz question generation response[${index}] must be an object`);
    }
    const { competency, prompt } = candidate as Record<string, unknown>;
    if (typeof competency !== "string") {
      throw new Error(`quiz question generation response[${index}] "competency" must be a string`);
    }
    if (typeof prompt !== "string") {
      throw new Error(`quiz question generation response[${index}] "prompt" must be a string`);
    }
    return { competency, prompt };
  });

  if (questions.length < MIN_QUESTIONS || questions.length > MAX_QUESTIONS) {
    throw new Error(
      `quiz question generation response must contain ${MIN_QUESTIONS}-${MAX_QUESTIONS} questions, got ${questions.length}`,
    );
  }

  return questions;
}
