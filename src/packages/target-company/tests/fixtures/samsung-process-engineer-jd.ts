/** A recorded JD text and the raw LLM response it produced, captured once by hand. Tests replay
 * this fixture instead of calling a real LLM. */
export const samsungProcessEngineerJdFixture = {
  jdText: [
    "[삼성전자 반도체 공정기술 엔지니어 채용]",
    "담당업무: 반도체 공정 개발 및 양산 기술 지원, 공정 데이터 분석을 통한 수율 개선",
    "자격요건: 반도체 공정에 대한 이해, 통계적 공정관리(SPC) 경험, Python/R을 활용한 데이터 분석, 품질관리(6시그마) 이해",
    "지원마감: 2026-09-30",
  ].join("\n"),
  rawResponse: JSON.stringify({
    competencies: ["반도체 공정 이해", "통계적 공정관리(SPC)", "Python/R 데이터 분석", "품질관리(6시그마)"],
    deadline: "2026-09-30",
  }),
  expected: {
    competencies: ["반도체 공정 이해", "통계적 공정관리(SPC)", "Python/R 데이터 분석", "품질관리(6시그마)"],
    deadline: "2026-09-30",
  },
};
