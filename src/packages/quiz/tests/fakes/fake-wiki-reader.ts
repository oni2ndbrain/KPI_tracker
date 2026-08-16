import type { EvidenceItem, EvidenceItemReader } from "../../../evidence-source/index.js";

/** In-memory stand-in for the LLM Wiki reader, used only in tests. */
export function createFakeWikiReader(items: EvidenceItem[]): EvidenceItemReader {
  return {
    async list() {
      return items;
    },
  };
}
