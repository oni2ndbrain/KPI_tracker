import type { EvidenceItemReader } from "../../evidence-source/index.js";
import {
  computeWeakItems,
  createKpi,
  isWrongAnswer,
  outstandingWrongQuestions,
  recordProgress,
} from "../../kpi-engine/index.js";
import type { QuizAnswerRecord, QuizQuestion, WeakItemReport } from "../../kpi-engine/index.js";
import type {
  KpiStorage,
  QuizActivityStorage,
  QuizResultStorage,
  TargetCompanyStorage,
} from "../../kpi-storage/index.js";
import type { QuizGradingClient } from "./grading-client.js";
import type { QuizQuestionGenerationClient } from "./question-generation-client.js";
import type { StudyRecommendationClient } from "./study-recommendation-client.js";

/** Single, not-per-target-company KPI — "퀴즈 점수 향상" tracks the trend of the average
 * quiz score overall, unlike "역량 채우기" which is scoped per target company. */
export const QUIZ_SCORE_KPI_ID = "quiz-score";
const QUIZ_SCORE_KPI_NAME = "퀴즈 점수 향상";
// The grading scale tops out at 5, so a rising average approaching 5 is full achievement.
const QUIZ_SCORE_KPI_TARGET = 5;

/** How much a wrong quiz answer corrects a target company's 역량 채우기 KPI down by — the KPI's
 * activity-based coverage assumed the competency was already covered, but a wrong answer shows
 * it wasn't really understood. */
const COMPETENCY_FILL_WRONG_CORRECTION = -1;

export interface SubmitAnswerInput {
  question: QuizQuestion;
  /** Already-transcribed text — voice-dictated or typed, indistinguishable here. */
  answerText: string;
}

export interface QuizSessionDeps {
  questionClient: QuizQuestionGenerationClient;
  gradingClient: QuizGradingClient;
  studyRecommendationClient: StudyRecommendationClient;
  wikiReader: EvidenceItemReader;
  kpiStorage: KpiStorage;
  quizResultStorage: QuizResultStorage;
  /** Records that a quiz session happened, so the already-shipped quiz-inactivity alert
   * (see kpi-engine's shouldSendQuizInactivityAlert) knows the user hasn't gone quiet. */
  quizActivityStorage: QuizActivityStorage;
  /** Looked up so a wrong answer can correct the 역량 채우기 KPI of every target company whose
   * requiredCompetencies includes the answered question's competency. */
  targetCompanyStorage: TargetCompanyStorage;
  /** Clock for answeredAt, injectable for deterministic tests. Defaults to the real time. */
  now?: () => string;
}

export interface QuizSession {
  /** Generates 3-5 fresh questions from the given required competencies and the LLM Wiki, plus
   * any previously wrong questions (among those competencies) still awaiting a correct answer. */
  generateQuestions(competencies: string[]): Promise<QuizQuestion[]>;
  /** Grades the answer, persists the result, folds the score into the 퀴즈 점수 향상 KPI, and — on a
   * wrong answer — corrects down every target company's 역량 채우기 KPI that counted this competency
   * as already covered. */
  submitAnswer(input: SubmitAnswerInput): Promise<QuizAnswerRecord>;
  /** Competencies whose two-or-more most recent answers were wrong in a row, each paired with a
   * study recommendation — LLM Wiki material first, freshly found material when the Wiki has nothing. */
  getWeakItems(): Promise<WeakItemReport[]>;
}

async function correctCompetencyFillKpis(
  deps: Pick<QuizSessionDeps, "targetCompanyStorage" | "kpiStorage">,
  competency: string,
): Promise<void> {
  const companies = await deps.targetCompanyStorage.list();
  const affected = companies.filter((company) => company.requiredCompetencies.includes(competency));

  await Promise.all(
    affected.map(async (company) => {
      const kpi = await deps.kpiStorage.load(company.kpiId);
      if (!kpi) return;
      const corrected = recordProgress(kpi, {
        category: "competency-fill",
        amount: COMPETENCY_FILL_WRONG_CORRECTION,
      });
      await deps.kpiStorage.save(corrected);
    }),
  );
}

export function createQuizSession(deps: QuizSessionDeps): QuizSession {
  const now = deps.now ?? (() => new Date().toISOString());

  return {
    async generateQuestions(competencies) {
      const wikiItems = await deps.wikiReader.list();
      const wikiNotes = wikiItems.map((item) => item.text);
      const candidates = await deps.questionClient.generate({ competencies, wikiNotes });
      const generatedAt = now();
      const generated = candidates.map((candidate, index) => ({ id: `${generatedAt}-${index}`, ...candidate }));

      const pastAnswers = await deps.quizResultStorage.list();
      const outstanding = outstandingWrongQuestions(pastAnswers).filter((question) =>
        competencies.includes(question.competency),
      );

      return [...outstanding, ...generated];
    },

    async submitAnswer({ question, answerText }) {
      const grading = await deps.gradingClient.grade({
        competency: question.competency,
        questionPrompt: question.prompt,
        answerText,
      });

      const answeredAt = now();
      const record: QuizAnswerRecord = {
        id: `${question.id}@${answeredAt}`,
        questionId: question.id,
        competency: question.competency,
        questionPrompt: question.prompt,
        answerText,
        score: grading.score,
        referencesPersonalExperience: grading.referencesPersonalExperience,
        isStructured: grading.isStructured,
        answeredAt,
      };
      await deps.quizResultStorage.save(record);
      await deps.quizActivityStorage.recordCompletion(answeredAt);

      const kpi =
        (await deps.kpiStorage.load(QUIZ_SCORE_KPI_ID)) ??
        createKpi({
          id: QUIZ_SCORE_KPI_ID,
          name: QUIZ_SCORE_KPI_NAME,
          category: "quiz-score",
          target: QUIZ_SCORE_KPI_TARGET,
        });
      const updatedKpi = recordProgress(kpi, { category: "quiz-score", score: grading.score });
      await deps.kpiStorage.save(updatedKpi);

      if (isWrongAnswer(record)) {
        await correctCompetencyFillKpis(deps, record.competency);
      }

      return record;
    },

    async getWeakItems() {
      const answers = await deps.quizResultStorage.list();
      const weakItems = computeWeakItems(answers);
      if (weakItems.length === 0) return [];

      const wikiItems = await deps.wikiReader.list();
      const wikiNotes = wikiItems.map((item) => item.text);

      return Promise.all(
        weakItems.map(async (weakItem) => {
          const recommendation = await deps.studyRecommendationClient.recommend({
            competency: weakItem.competency,
            wikiNotes,
          });
          return { ...weakItem, recommendation };
        }),
      );
    },
  };
}
