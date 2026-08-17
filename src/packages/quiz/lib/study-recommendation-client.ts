import type { StudyRecommendation } from "../../kpi-engine/index.js";
import type { StudyRecommendationInput } from "./study-recommendation.js";

/** The narrow surface quiz depends on for turning a weak competency + LLM Wiki notes into a study
 * recommendation. A production implementation calls an LLM and runs its response through
 * parseStudyRecommendationResponse; tests use a fixture-backed fake — never a live call. */
export interface StudyRecommendationClient {
  recommend(input: StudyRecommendationInput): Promise<StudyRecommendation>;
}
