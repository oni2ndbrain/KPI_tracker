/** A recorded source text and the raw LLM response it produced, captured once by hand. Tests
 * replay this fixture instead of calling a real LLM. */
export const processImprovementNoteFixture = {
  sourceText: [
    "2026-07 LLM Wiki 노트: 이번 달 진행한 작업 정리.",
    "- 공정 데이터 분석 스크립트를 Python으로 작성해 수율 이상치를 자동으로 탐지하도록 함.",
    "- SPC 관리도 기준을 팀과 협의해 새로 정의하고 문서화함.",
    "- 다음 주엔 6시그마 그린벨트 교재 3장을 복습할 예정.",
  ].join("\n"),
  rawResponse: JSON.stringify([
    {
      title: "수율 이상치 자동 탐지 스크립트 개발",
      description: "Python으로 공정 데이터 분석 스크립트를 작성해 수율 이상치를 자동으로 탐지하도록 함",
    },
    {
      title: "SPC 관리도 기준 재정의",
      description: "팀과 협의해 SPC 관리도 기준을 새로 정의하고 문서화함",
    },
  ]),
  expected: [
    {
      title: "수율 이상치 자동 탐지 스크립트 개발",
      description: "Python으로 공정 데이터 분석 스크립트를 작성해 수율 이상치를 자동으로 탐지하도록 함",
    },
    {
      title: "SPC 관리도 기준 재정의",
      description: "팀과 협의해 SPC 관리도 기준을 새로 정의하고 문서화함",
    },
  ],
};
