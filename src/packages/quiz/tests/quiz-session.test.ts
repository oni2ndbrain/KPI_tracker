import { describe, expect, test } from "vitest";
import { createQuizSession } from "../index.js";
import { createFakeKpiStorage } from "./fakes/fake-kpi-storage.js";
import { createFakeQuizActivityStorage } from "./fakes/fake-quiz-activity-storage.js";
import { createFakeQuizResultStorage } from "./fakes/fake-quiz-result-storage.js";
import { createFakeWikiReader } from "./fakes/fake-wiki-reader.js";
import { createFixtureQuizGradingClient } from "./fakes/fixture-quiz-grading-client.js";
import { createFixtureQuizQuestionClient } from "./fakes/fixture-quiz-question-client.js";

const competencies = ["통계적 공정관리(SPC)", "품질관리(6시그마)"];
const questionCandidates = [
  { competency: "통계적 공정관리(SPC)", prompt: "SPC 관리도에서 이상점이 발생했을 때 어떻게 대응했는지 설명하세요." },
  { competency: "통계적 공정관리(SPC)", prompt: "UCL/LCL을 벗어난 데이터를 판정하는 기준은 무엇인가요?" },
  { competency: "품질관리(6시그마)", prompt: "DMAIC 프로세스 중 Analyze 단계에서 수행한 작업을 설명하세요." },
];

function sessionWithFixtures(overrides: { now?: () => string } = {}) {
  const wikiReader = createFakeWikiReader([
    { sourceId: "note-1", sourceVersion: "v1", sourceType: "wiki-note", text: "SPC 관리도 노트" },
  ]);
  const questionClient = createFixtureQuizQuestionClient({
    [competencies.join("|")]: questionCandidates,
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
  const kpiStorage = createFakeKpiStorage();
  const quizResultStorage = createFakeQuizResultStorage();
  const quizActivityStorage = createFakeQuizActivityStorage();
  const session = createQuizSession({
    questionClient,
    gradingClient,
    wikiReader,
    kpiStorage,
    quizResultStorage,
    quizActivityStorage,
    ...overrides,
  });

  return { session, kpiStorage, quizResultStorage, quizActivityStorage };
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
});
