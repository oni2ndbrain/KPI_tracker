import { describe, expect, test } from "vitest";
import { createKpi, recordProgress } from "../../kpi-engine/index.js";
import type { TargetCompany } from "../../kpi-engine/index.js";
import { createQuizSession } from "../index.js";
import { createFakeKpiStorage } from "./fakes/fake-kpi-storage.js";
import { createFakeQuizActivityStorage } from "./fakes/fake-quiz-activity-storage.js";
import { createFakeQuizResultStorage } from "./fakes/fake-quiz-result-storage.js";
import { createFakeTargetCompanyStorage } from "./fakes/fake-target-company-storage.js";
import { createFakeWikiReader } from "./fakes/fake-wiki-reader.js";
import { createFixtureQuizGradingClient } from "./fakes/fixture-quiz-grading-client.js";
import { createFixtureQuizQuestionClient } from "./fakes/fixture-quiz-question-client.js";
import { createFixtureStudyRecommendationClient } from "./fakes/fixture-study-recommendation-client.js";

const competencies = ["통계적 공정관리(SPC)", "품질관리(6시그마)"];
const questionCandidates = [
  { competency: "통계적 공정관리(SPC)", prompt: "SPC 관리도에서 이상점이 발생했을 때 어떻게 대응했는지 설명하세요." },
  { competency: "통계적 공정관리(SPC)", prompt: "UCL/LCL을 벗어난 데이터를 판정하는 기준은 무엇인가요?" },
  { competency: "품질관리(6시그마)", prompt: "DMAIC 프로세스 중 Analyze 단계에서 수행한 작업을 설명하세요." },
];

function samsungCompany(overrides: Partial<TargetCompany> = {}): TargetCompany {
  return {
    id: "samsung",
    name: "삼성전자",
    requiredCompetencies: competencies,
    deadline: "2026-09-30",
    gap: [],
    kpiId: "samsung-competency-fill",
    applicationPeriod: null,
    ...overrides,
  };
}

function sessionWithFixtures(
  overrides: { now?: () => string; targetCompanies?: TargetCompany[] } = {},
) {
  const wikiReader = createFakeWikiReader([
    { sourceId: "note-1", sourceVersion: "v1", sourceType: "wiki-note", text: "SPC 관리도 노트" },
  ]);
  const questionClient = createFixtureQuizQuestionClient({
    [competencies.join("|")]: questionCandidates,
    "품질관리(6시그마)": [questionCandidates[2]!],
  });
  const gradingClient = createFixtureQuizGradingClient({
    "이전 프로젝트에서 관리도 이탈을 원인 분석 후 해결했습니다.": {
      score: 4,
      referencesPersonalExperience: true,
      isStructured: true,
    },
    "잘 몰라서 그냥 답했습니다.": {
      score: 2,
      referencesPersonalExperience: false,
      isStructured: false,
    },
  });
  const studyRecommendationClient = createFixtureStudyRecommendationClient({
    "통계적 공정관리(SPC)": {
      source: "llm-wiki",
      title: "SPC 관리도 노트",
      reference: "note-1",
    },
  });
  const kpiStorage = createFakeKpiStorage();
  const quizResultStorage = createFakeQuizResultStorage();
  const quizActivityStorage = createFakeQuizActivityStorage();
  const targetCompanyStorage = createFakeTargetCompanyStorage(overrides.targetCompanies ?? []);
  const session = createQuizSession({
    questionClient,
    gradingClient,
    studyRecommendationClient,
    wikiReader,
    kpiStorage,
    quizResultStorage,
    quizActivityStorage,
    targetCompanyStorage,
    ...(overrides.now ? { now: overrides.now } : {}),
  });

  return { session, kpiStorage, quizResultStorage, quizActivityStorage, targetCompanyStorage };
}

describe("createQuizSession: generateQuestions", () => {
  test("generates questions using both the given competencies and the LLM Wiki notes", async () => {
    const { session } = sessionWithFixtures();

    const questions = await session.generateQuestions(competencies);

    expect(questions.map((q) => ({ competency: q.competency, prompt: q.prompt }))).toEqual(questionCandidates);
  });

  test("assigns each generated question a unique id", async () => {
    const { session } = sessionWithFixtures();

    const questions = await session.generateQuestions(competencies);

    expect(new Set(questions.map((q) => q.id)).size).toBe(questions.length);
  });

  test("re-includes a previously wrong question among the given competencies", async () => {
    const { session } = sessionWithFixtures({ now: () => "2026-08-17T00:00:00.000Z" });
    const outstandingQuestion = { id: "q0", competency: "통계적 공정관리(SPC)", prompt: questionCandidates[0]!.prompt };

    await session.submitAnswer({ question: outstandingQuestion, answerText: "잘 몰라서 그냥 답했습니다." });
    const questions = await session.generateQuestions(competencies);

    expect(questions).toContainEqual(outstandingQuestion);
  });

  test("does not re-include a wrong question once it has since been answered correctly", async () => {
    const { session } = sessionWithFixtures({ now: () => "2026-08-17T00:00:00.000Z" });
    const question = { id: "q0", competency: "통계적 공정관리(SPC)", prompt: questionCandidates[0]!.prompt };

    await session.submitAnswer({ question, answerText: "잘 몰라서 그냥 답했습니다." });
    await session.submitAnswer({ question, answerText: "이전 프로젝트에서 관리도 이탈을 원인 분석 후 해결했습니다." });
    const questions = await session.generateQuestions(competencies);

    expect(questions).not.toContainEqual(question);
  });

  test("does not re-include a wrong question whose competency isn't in the requested set", async () => {
    const { session } = sessionWithFixtures({ now: () => "2026-08-17T00:00:00.000Z" });
    const question = { id: "q0", competency: "통계적 공정관리(SPC)", prompt: questionCandidates[0]!.prompt };

    await session.submitAnswer({ question, answerText: "잘 몰라서 그냥 답했습니다." });
    const questions = await session.generateQuestions(["품질관리(6시그마)"]);

    expect(questions).not.toContainEqual(question);
  });
});

describe("createQuizSession: submitAnswer", () => {
  test("grades the answer and returns the persisted record", async () => {
    const { session } = sessionWithFixtures({ now: () => "2026-08-17T00:00:00.000Z" });
    const question = { id: "q0", competency: "통계적 공정관리(SPC)", prompt: questionCandidates[0]!.prompt };

    const record = await session.submitAnswer({
      question,
      answerText: "이전 프로젝트에서 관리도 이탈을 원인 분석 후 해결했습니다.",
    });

    expect(record).toEqual({
      id: "q0@2026-08-17T00:00:00.000Z",
      questionId: "q0",
      competency: "통계적 공정관리(SPC)",
      questionPrompt: questionCandidates[0]!.prompt,
      answerText: "이전 프로젝트에서 관리도 이탈을 원인 분석 후 해결했습니다.",
      score: 4,
      referencesPersonalExperience: true,
      isStructured: true,
      answeredAt: "2026-08-17T00:00:00.000Z",
    });
  });

  test("saves the graded result so it can be listed back", async () => {
    const { session, quizResultStorage } = sessionWithFixtures();
    const question = { id: "q0", competency: "통계적 공정관리(SPC)", prompt: questionCandidates[0]!.prompt };

    const record = await session.submitAnswer({
      question,
      answerText: "이전 프로젝트에서 관리도 이탈을 원인 분석 후 해결했습니다.",
    });

    expect(await quizResultStorage.list()).toEqual([record]);
  });

  test("records quiz activity so the quiz-inactivity alert sees a fresh completion", async () => {
    const { session, quizActivityStorage } = sessionWithFixtures({ now: () => "2026-08-17T00:00:00.000Z" });
    const question = { id: "q0", competency: "통계적 공정관리(SPC)", prompt: questionCandidates[0]!.prompt };

    await session.submitAnswer({
      question,
      answerText: "이전 프로젝트에서 관리도 이탈을 원인 분석 후 해결했습니다.",
    });

    expect(await quizActivityStorage.lastCompletedAt()).toBe("2026-08-17T00:00:00.000Z");
  });

  test("creates the 퀴즈 점수 향상 KPI on the first answer, seeded from that answer's score", async () => {
    const { session, kpiStorage } = sessionWithFixtures();
    const question = { id: "q0", competency: "통계적 공정관리(SPC)", prompt: questionCandidates[0]!.prompt };

    await session.submitAnswer({
      question,
      answerText: "이전 프로젝트에서 관리도 이탈을 원인 분석 후 해결했습니다.",
    });

    const kpi = await kpiStorage.load("quiz-score");
    expect(kpi?.definition).toEqual({
      id: "quiz-score",
      name: "퀴즈 점수 향상",
      category: "quiz-score",
      target: 5,
    });
    expect(kpi?.currentValue).toBe(4);
    expect(kpi?.achievementRate).toBe(0.8);
  });

  test("folds each subsequent answer's score into the KPI's running average", async () => {
    const { session, kpiStorage } = sessionWithFixtures();
    const question0 = { id: "q0", competency: "통계적 공정관리(SPC)", prompt: questionCandidates[0]!.prompt };
    const question1 = { id: "q1", competency: "품질관리(6시그마)", prompt: questionCandidates[2]!.prompt };

    await session.submitAnswer({
      question: question0,
      answerText: "이전 프로젝트에서 관리도 이탈을 원인 분석 후 해결했습니다.",
    });
    await session.submitAnswer({ question: question1, answerText: "잘 몰라서 그냥 답했습니다." });

    const kpi = await kpiStorage.load("quiz-score");
    expect(kpi?.currentValue).toBe(3);
  });

  test("corrects down every target company's 역량 채우기 KPI that requires the wrongly-answered competency", async () => {
    const company = samsungCompany();
    const seededKpi = recordProgress(
      createKpi({ id: company.kpiId, name: "삼성전자 역량 채우기", category: "competency-fill", target: 8 }),
      { category: "competency-fill", amount: 5 },
    );
    const { session, kpiStorage } = sessionWithFixtures({ targetCompanies: [company] });
    await kpiStorage.save(seededKpi);
    const question = { id: "q0", competency: "통계적 공정관리(SPC)", prompt: questionCandidates[0]!.prompt };

    await session.submitAnswer({ question, answerText: "잘 몰라서 그냥 답했습니다." });

    const kpi = await kpiStorage.load(company.kpiId);
    expect(kpi?.currentValue).toBe(4);
  });

  test("does not correct a target company's 역량 채우기 KPI on a correct answer", async () => {
    const company = samsungCompany();
    const seededKpi = recordProgress(
      createKpi({ id: company.kpiId, name: "삼성전자 역량 채우기", category: "competency-fill", target: 8 }),
      { category: "competency-fill", amount: 5 },
    );
    const { session, kpiStorage } = sessionWithFixtures({ targetCompanies: [company] });
    await kpiStorage.save(seededKpi);
    const question = { id: "q0", competency: "통계적 공정관리(SPC)", prompt: questionCandidates[0]!.prompt };

    await session.submitAnswer({
      question,
      answerText: "이전 프로젝트에서 관리도 이탈을 원인 분석 후 해결했습니다.",
    });

    const kpi = await kpiStorage.load(company.kpiId);
    expect(kpi?.currentValue).toBe(5);
  });

  test("does not correct a target company whose requiredCompetencies doesn't include the answered competency", async () => {
    const company = samsungCompany({ requiredCompetencies: ["품질관리(6시그마)"] });
    const seededKpi = recordProgress(
      createKpi({ id: company.kpiId, name: "삼성전자 역량 채우기", category: "competency-fill", target: 8 }),
      { category: "competency-fill", amount: 5 },
    );
    const { session, kpiStorage } = sessionWithFixtures({ targetCompanies: [company] });
    await kpiStorage.save(seededKpi);
    const question = { id: "q0", competency: "통계적 공정관리(SPC)", prompt: questionCandidates[0]!.prompt };

    await session.submitAnswer({ question, answerText: "잘 몰라서 그냥 답했습니다." });

    const kpi = await kpiStorage.load(company.kpiId);
    expect(kpi?.currentValue).toBe(5);
  });
});

describe("createQuizSession: getWeakItems", () => {
  test("returns no weak items when no competency has two wrong answers in a row", async () => {
    const { session } = sessionWithFixtures();

    expect(await session.getWeakItems()).toEqual([]);
  });

  test("flags a competency weak once its two most recent answers are both wrong, with a study recommendation", async () => {
    const { session } = sessionWithFixtures({ now: () => "2026-08-17T00:00:00.000Z" });
    const question0 = { id: "q0", competency: "통계적 공정관리(SPC)", prompt: questionCandidates[0]!.prompt };
    const question1 = { id: "q1", competency: "통계적 공정관리(SPC)", prompt: questionCandidates[1]!.prompt };

    await session.submitAnswer({ question: question0, answerText: "잘 몰라서 그냥 답했습니다." });
    await session.submitAnswer({ question: question1, answerText: "잘 몰라서 그냥 답했습니다." });

    expect(await session.getWeakItems()).toEqual([
      {
        competency: "통계적 공정관리(SPC)",
        consecutiveWrongCount: 2,
        recommendation: { source: "llm-wiki", title: "SPC 관리도 노트", reference: "note-1" },
      },
    ]);
  });

  test("does not flag a competency weak after only one wrong answer", async () => {
    const { session } = sessionWithFixtures();
    const question = { id: "q0", competency: "통계적 공정관리(SPC)", prompt: questionCandidates[0]!.prompt };

    await session.submitAnswer({ question, answerText: "잘 몰라서 그냥 답했습니다." });

    expect(await session.getWeakItems()).toEqual([]);
  });
});
