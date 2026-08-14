import type { JdExtractionClient, JdExtractionResult } from "../../index.js";

/** Fixture-backed fake — returns a canned result keyed by JD text, never calls a real LLM. */
export function createFixtureJdExtractionClient(
  fixtures: Record<string, JdExtractionResult>,
): JdExtractionClient {
  return {
    async extract(jdText) {
      const result = fixtures[jdText];
      if (!result) throw new Error(`no fixture registered for JD text: ${jdText.slice(0, 40)}...`);
      return result;
    },
  };
}
