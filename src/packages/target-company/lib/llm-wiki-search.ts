/** The narrow surface target-company depends on for checking which required competencies already
 * have related material in the LLM Wiki. A production implementation reads the LLM Wiki folder
 * (see the evidence-source reader); tests use an in-memory fake. */
export interface LlmWikiSearch {
  /** Returns the subset of the given competencies that already have related material in the LLM Wiki. */
  covered(competencies: string[]): Promise<string[]>;
}
