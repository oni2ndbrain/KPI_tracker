import type { JdExtractionResult } from "./types.js";

export function buildJdExtractionPrompt(jdText: string): string {
  return [
    "다음은 채용공고 원문이다. 요구 역량 목록과 지원 마감일을 다음 JSON 형식으로만 답하라:",
    '{"competencies": string[], "deadline": "YYYY-MM-DD"}',
    "",
    jdText,
  ].join("\n");
}

/** Parses a recorded LLM response into structured data. Never calls an LLM itself — production
 * code feeds this the raw text of a real call; tests feed it a recorded fixture response. */
export function parseJdExtractionResponse(rawResponse: string): JdExtractionResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawResponse);
  } catch {
    throw new Error(`JD extraction response is not valid JSON: ${rawResponse}`);
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("JD extraction response must be a JSON object");
  }

  const { competencies, deadline } = parsed as Record<string, unknown>;

  if (!Array.isArray(competencies) || !competencies.every((c) => typeof c === "string")) {
    throw new Error('JD extraction response "competencies" must be a string array');
  }
  if (typeof deadline !== "string") {
    throw new Error('JD extraction response "deadline" must be a string');
  }

  return { competencies, deadline };
}
