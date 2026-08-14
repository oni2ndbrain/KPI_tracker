import type { EvidenceItem, EvidenceItemReader } from "../../index.js";

/** In-memory stand-in for a document/wiki EvidenceItemReader, used only in tests. */
export function createFakeEvidenceItemReader(items: EvidenceItem[]): EvidenceItemReader {
  return {
    async list() {
      return items;
    },
  };
}
