/** A recorded competencies+wiki-notes input and the raw LLM response it produced, captured once
 * by hand. Tests replay this fixture instead of calling a real LLM. */
export const spcQuizQuestionsFixture = {
  input: {
    competencies: ["통계적 공정관리(SPC)", "품질관리(6시그마)"],
    wikiNotes: [
      "SPC 관리도의 UCL/LCL 이탈 판정 기준을 정리한 노트",
      "6시그마 DMAIC 프로세스 요약 노트",
    ],
  },
  rawResponse: JSON.stringify([
    { competency: "통계적 공정관리(SPC)", prompt: "SPC 관리도에서 이상점이 발생했을 때 어떻게 대응했는지 설명하세요." },
    { competency: "통계적 공정관리(SPC)", prompt: "UCL/LCL을 벗어난 데이터를 판정하는 기준은 무엇인가요?" },
    { competency: "품질관리(6시그마)", prompt: "DMAIC 프로세스 중 Analyze 단계에서 수행한 작업을 설명하세요." },
  ]),
  expected: [
    { competency: "통계적 공정관리(SPC)", prompt: "SPC 관리도에서 이상점이 발생했을 때 어떻게 대응했는지 설명하세요." },
    { competency: "통계적 공정관리(SPC)", prompt: "UCL/LCL을 벗어난 데이터를 판정하는 기준은 무엇인가요?" },
    { competency: "품질관리(6시그마)", prompt: "DMAIC 프로세스 중 Analyze 단계에서 수행한 작업을 설명하세요." },
  ],
};
