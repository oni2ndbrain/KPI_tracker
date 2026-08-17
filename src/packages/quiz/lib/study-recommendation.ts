import type { StudyRecommendation } from "../../kpi-engine/index.js";

export interface StudyRecommendationInput {
  /** The weak competency to find study material for. */
  competency: string;
  /** Raw LLM Wiki note/conversation text to check for existing related material before searching fresh. */
  wikiNotes: string[];
}

export function buildStudyRecommendationPrompt(input: StudyRecommendationInput): string {
  return [
    "다음은 역량 진단 퀴즈에서 취약 항목으로 확인된 역량과, 참고용 LLM Wiki 노트 목록이다.",
    "LLM Wiki 노트 중 이 역량과 관련된 자료가 있으면 그것부터 추천하고, 관련 자료가 없으면 새로 찾아 추천하라.",
    "다음 JSON 형식으로만 답하라:",
    '{"source": "llm-wiki" | "web-search", "title": string, "reference": string}',
    "",
    `역량: ${input.competency}`,
    "",
    "LLM Wiki 노트:",
    input.wikiNotes.join("\n---\n"),
  ].join("\n");
}

const VALID_SOURCES = new Set(["llm-wiki", "web-search"]);

/** Parses a recorded LLM response into structured data. Never calls an LLM itself — production
 * code feeds this the raw text of a real call; tests feed it a recorded fixture response. */
export function parseStudyRecommendationResponse(rawResponse: string): StudyRecommendation {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawResponse);
  } catch {
    throw new Error(`study recommendation response is not valid JSON: ${rawResponse}`);
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("study recommendation response must be a JSON object");
  }

  const { source, title, reference } = parsed as Record<string, unknown>;

  if (typeof source !== "string" || !VALID_SOURCES.has(source)) {
    throw new Error('study recommendation response "source" must be "llm-wiki" or "web-search"');
  }
  if (typeof title !== "string") {
    throw new Error('study recommendation response "title" must be a string');
  }
  if (typeof reference !== "string") {
    throw new Error('study recommendation response "reference" must be a string');
  }

  return { source: source as StudyRecommendation["source"], title, reference };
}
