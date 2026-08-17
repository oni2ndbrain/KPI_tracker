import type { JdExtractionClient } from "./jd-extraction-client.js";
import type { JdExtractionResult } from "./types.js";

const REQUIREMENTS_LINE_PATTERN = /^\s*(자격요건|요구\s*역량)\s*[:：]\s*(.+)$/mu;
const DEADLINE_PATTERN = /\d{4}-\d{2}-\d{2}/u;

function extractCompetencies(jdText: string): string[] {
  const match = jdText.match(REQUIREMENTS_LINE_PATTERN);
  if (!match) {
    throw new Error('채용공고에서 "자격요건:" 항목을 찾을 수 없어요. 요구 역량을 쉼표로 구분해 적어주세요.');
  }

  const competencies = match[2]!
    .split(/[,、·]/u)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  if (competencies.length === 0) {
    throw new Error('"자격요건:" 항목에서 역량을 추출하지 못했어요. 쉼표로 구분해 적어주세요.');
  }

  return competencies;
}

function extractDeadline(jdText: string): string {
  const match = jdText.match(DEADLINE_PATTERN);
  if (!match) {
    throw new Error('채용공고에서 지원 마감일을 찾을 수 없어요. "YYYY-MM-DD" 형식으로 적어주세요 (예: 지원마감: 2026-09-30).');
  }
  return match[0];
}

/** Deterministic, non-LLM JD extraction — parses a "자격요건: a, b, c" line and a "YYYY-MM-DD"
 * deadline out of the pasted JD text directly, without calling out to an LLM. A placeholder for the
 * real LLM-backed extraction (buildJdExtractionPrompt + parseJdExtractionResponse) that the target
 * company register flow was designed around — see jd-extraction.ts. Wiring an actual LLM call is a
 * separate concern (new dependency + API key) left for a future ticket; this keeps 목표 회사 등록
 * usable today for JDs written in the expected 자격요건/지원마감 format. */
export function createHeuristicJdExtractionClient(): JdExtractionClient {
  return {
    async extract(jdText: string): Promise<JdExtractionResult> {
      return {
        competencies: extractCompetencies(jdText),
        deadline: extractDeadline(jdText),
      };
    },
  };
}
