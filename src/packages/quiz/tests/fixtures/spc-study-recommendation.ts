/** A recorded competency+wiki-notes input and the raw LLM response it produced, captured once by
 * hand. Tests replay this fixture instead of calling a real LLM. */
export const spcStudyRecommendationFixture = {
  input: {
    competency: "통계적 공정관리(SPC)",
    wikiNotes: ["SPC 관리도의 UCL/LCL 이탈 판정 기준을 정리한 노트"],
  },
  rawResponse: JSON.stringify({
    source: "llm-wiki",
    title: "SPC 관리도의 UCL/LCL 이탈 판정 기준을 정리한 노트",
    reference: "note-spc-1",
  }),
  expected: {
    source: "llm-wiki",
    title: "SPC 관리도의 UCL/LCL 이탈 판정 기준을 정리한 노트",
    reference: "note-spc-1",
  },
};
