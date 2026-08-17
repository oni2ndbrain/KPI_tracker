import { describe, expect, test } from "vitest";
import type { KpiState, QuizAnswerRecord, TargetCompany } from "../../kpi-engine/index.js";
import { buildDashboardViewModel, renderDashboardPage } from "../index.js";

const kpis: KpiState[] = [
  {
    definition: { id: "samsung-competency-fill", name: "삼성전자 공정기술 역량 채우기", category: "competency-fill", target: 100 },
    history: [62],
    currentValue: 62,
    achievementRate: 0.62,
  },
  {
    definition: { id: "apply-2026-08", name: "이번 달 지원 건수", category: "activity-count", target: 5 },
    history: [1, 1, 1],
    currentValue: 3,
    achievementRate: 0.6,
  },
];

const targetCompanies: TargetCompany[] = [
  {
    id: "samsung",
    name: "삼성전자 · 공정기술",
    requiredCompetencies: ["포토공정", "식각공정"],
    deadline: "2026-09-04",
    gap: ["포토공정"],
    kpiId: "samsung-competency-fill",
    applicationPeriod: null,
  },
];

const quizAnswers: QuizAnswerRecord[] = [
  {
    id: "a1",
    questionId: "q1",
    competency: "식각공정",
    questionPrompt: "prompt",
    answerText: "answer",
    score: 4,
    referencesPersonalExperience: true,
    isStructured: true,
    answeredAt: "2026-08-10T00:00:00.000Z",
  },
];

const model = buildDashboardViewModel({
  kpis,
  targetCompanies,
  quizAnswers,
  lastQuizAt: "2026-08-08T00:00:00.000Z",
  today: "2026-08-17",
  generatedAt: "2026-08-17T00:00:00.000Z",
});

describe("renderDashboardPage", () => {
  test("includes every KPI name and target company name", () => {
    const html = renderDashboardPage(model);

    expect(html).toContain("삼성전자 공정기술 역량 채우기");
    expect(html).toContain("이번 달 지원 건수");
    expect(html).toContain("삼성전자 · 공정기술");
  });

  test("shows the target company's D-day and gap", () => {
    const html = renderDashboardPage(model);

    expect(html).toContain("D-18");
    expect(html).toContain("부족 역량: 포토공정");
  });

  test("includes a hidden 지표 정의서 block per category", () => {
    const html = renderDashboardPage(model);

    expect(html).toContain('id="def-competency-fill"');
    expect(html).toContain('id="def-activity-count"');
    expect(html).toContain('id="def-project-completion"');
    expect(html).toContain('id="def-quiz-score"');
  });

  test("marks every KPI/stat-tile item as clickable toward its category's definition", () => {
    const html = renderDashboardPage(model);

    expect(html).toContain('data-category="competency-fill"');
    expect(html).toContain('data-category="activity-count"');
  });

  test("shows a quiz-inactivity banner with the real day count and per-competency scores", () => {
    const html = renderDashboardPage(model);

    expect(html).toContain("마지막 진단 9일 전");
    expect(html).toContain("식각공정");
    expect(html).toContain("4.0/5");
  });

  test("prompts to take a first quiz when none has ever been taken", () => {
    const noQuizModel = buildDashboardViewModel({
      kpis,
      targetCompanies,
      quizAnswers: [],
      lastQuizAt: null,
      today: "2026-08-17",
      generatedAt: "2026-08-17T00:00:00.000Z",
    });

    const html = renderDashboardPage(noQuizModel);

    expect(html).toContain("아직 역량 진단 퀴즈를 진행한 적이 없어요");
  });

  test("matches the agreed golden layout", () => {
    expect(renderDashboardPage(model)).toMatchSnapshot();
  });
});
