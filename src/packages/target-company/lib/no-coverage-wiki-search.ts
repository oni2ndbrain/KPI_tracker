import type { LlmWikiSearch } from "./llm-wiki-search.js";

/** Placeholder LlmWikiSearch that treats nothing as already covered — the conservative default
 * (every required competency counts as a gap) until the real LLM Wiki search (reading the LLM Wiki
 * folder via evidence-source's wiki reader, cross-referenced by an LLM) is wired up. */
export function createNoCoverageWikiSearch(): LlmWikiSearch {
  return {
    async covered() {
      return [];
    },
  };
}
