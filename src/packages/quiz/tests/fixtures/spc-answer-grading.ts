/** A recorded question+answer input and the raw LLM response it produced, captured once by hand.
 * Tests replay this fixture instead of calling a real LLM. */
export const spcAnswerGradingFixture = {
  input: {
    competency: "통계적 공정관리(SPC)",
    questionPrompt: "SPC 관리도에서 이상점이 발생했을 때 어떻게 대응했는지 설명하세요.",
    answerText:
      "이전 프로젝트에서 관리도 이탈을 발견했을 때, 후속 공정에 미치는 영향을 먼저 분석하고 원인을 추적해 설비 파라미터를 조정하는 방식으로 해결했습니다.",
  },
  rawResponse: JSON.stringify({ score: 5, referencesPersonalExperience: true, isStructured: true }),
  expected: { score: 5, referencesPersonalExperience: true, isStructured: true },
};
