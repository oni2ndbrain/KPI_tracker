import type { AchievementCandidate } from "./types.js";

export function buildAchievementExtractionPrompt(sourceText: string): string {
  return [
    "다음은 개인이 작성한 문서 또는 노트의 원문이다. 자소서·면접에 활용할 수 있는 성과(실제로 수행한 작업/경험)",
    "후보를 찾아 다음 JSON 형식으로만 답하라. 성과 후보가 없으면 빈 배열을 반환하라:",
    '[{"title": string, "description": string}]',
    "",
    sourceText,
  ].join("\n");
}

/** Parses a recorded LLM response into structured data. Never calls an LLM itself — production
 * code feeds this the raw text of a real call; tests feed it a recorded fixture response. */
export function parseAchievementExtractionResponse(rawResponse: string): AchievementCandidate[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawResponse);
  } catch {
    throw new Error(`achievement extraction response is not valid JSON: ${rawResponse}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error("achievement extraction response must be a JSON array");
  }

  return parsed.map((candidate, index) => {
    if (typeof candidate !== "object" || candidate === null) {
      throw new Error(`achievement extraction response[${index}] must be an object`);
    }
    const { title, description } = candidate as Record<string, unknown>;
    if (typeof title !== "string") {
      throw new Error(`achievement extraction response[${index}] "title" must be a string`);
    }
    if (typeof description !== "string") {
      throw new Error(`achievement extraction response[${index}] "description" must be a string`);
    }
    return { title, description };
  });
}
