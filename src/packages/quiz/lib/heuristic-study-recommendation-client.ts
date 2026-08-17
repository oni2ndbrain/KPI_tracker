import type { StudyRecommendation } from "../../kpi-engine/index.js";
import type { StudyRecommendationClient } from "./study-recommendation-client.js";

const REFERENCE_EXCERPT_LENGTH = 80;

/** Deterministic, non-LLM study recommendation — a plain substring check for whether any LLM Wiki
 * note mentions the weak competency, instead of an LLM judging relevance. A placeholder for the
 * real LLM-backed recommender (buildStudyRecommendationPrompt + parseStudyRecommendationResponse)
 * this client interface was designed around. Wiring an actual LLM call is a separate concern left
 * for a future ticket; this keeps 취약 항목 학습 제안 usable today. */
export function createHeuristicStudyRecommendationClient(): StudyRecommendationClient {
  return {
    async recommend({ competency, wikiNotes }): Promise<StudyRecommendation> {
      const related = wikiNotes.find((note) => note.includes(competency));
      if (related) {
        return {
          source: "llm-wiki",
          title: `${competency} 관련 LLM Wiki 노트`,
          reference: related.slice(0, REFERENCE_EXCERPT_LENGTH),
        };
      }
      return {
        source: "web-search",
        title: `${competency} 학습 자료 찾아보기`,
        reference: `"${competency}" 관련 자료를 검색해서 학습해보세요.`,
      };
    },
  };
}
