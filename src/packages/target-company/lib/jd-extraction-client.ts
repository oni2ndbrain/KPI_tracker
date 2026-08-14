import type { JdExtractionResult } from "./types.js";

/** The narrow surface target-company depends on for turning JD text into structured requirements.
 * A production implementation calls an LLM and runs its response through parseJdExtractionResponse;
 * tests use a fixture-backed fake — never a live call. */
export interface JdExtractionClient {
  extract(jdText: string): Promise<JdExtractionResult>;
}
