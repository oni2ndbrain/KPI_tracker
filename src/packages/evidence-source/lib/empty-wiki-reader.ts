import type { EvidenceItemReader } from "./types.js";

/** Placeholder EvidenceItemReader that always returns no items — used where the real LLM Wiki
 * folder reader (createFsWikiReader) isn't wired up yet (no real folder paths configured). Mirrors
 * target-company's createNoCoverageWikiSearch: a conservative "nothing found yet" default rather
 * than a hard dependency on infrastructure that isn't set up. */
export function createEmptyWikiReader(): EvidenceItemReader {
  return {
    async list() {
      return [];
    },
  };
}
