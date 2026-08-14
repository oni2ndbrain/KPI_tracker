import type { AchievementCandidate } from "./types.js";

/** The narrow surface evidence-source depends on for turning raw source text into achievement
 * candidates. A production implementation calls an LLM and runs its response through
 * parseAchievementExtractionResponse; tests use a fixture-backed fake — never a live call. */
export interface AchievementExtractionClient {
  extract(sourceText: string): Promise<AchievementCandidate[]>;
}
