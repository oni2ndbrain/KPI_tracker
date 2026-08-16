import type { EvidenceItemReader } from "../../evidence-source/index.js";
import { createKpi, recordProgress } from "../../kpi-engine/index.js";
import type { QuizAnswerRecord, QuizQuestion } from "../../kpi-engine/index.js";
import type { KpiStorage, QuizActivityStorage, QuizResultStorage } from "../../kpi-storage/index.js";
import type { QuizGradingClient } from "./grading-client.js";
import type { QuizQuestionGenerationClient } from "./question-generation-client.js";

/** Single, not-per-target-company KPI — "퀴즈 점수 향상" tracks the trend of the average
 * quiz score overall, unlike "역량 채우기" which is scoped per target company. */
export const QUIZ_SCORE_KPI_ID = "quiz-score";
const QUIZ_SCORE_KPI_NAME = "퀴즈 점수 향상";
// The grading scale tops out at 5, so a rising average approaching 5 is full achievement.
const QUIZ_SCORE_KPI_TARGET = 5;

export interface SubmitAnswerInput {
  question: QuizQuestion;
  /** Already-transcribed text — voice-dictated or typed, indistinguishable here. */
  answerText: string;
}

export interface QuizSessionDeps {
  questionClient: QuizQuestionGenerationClient;
  gradingClient: QuizGradingClient;
  wikiReader: EvidenceItemReader;
  kpiStorage: KpiStorage;
  quizResultStorage: QuizResultStorage;
  /** Records that a quiz session happened, so the already-shipped quiz-inactivity alert
   * (see kpi-engine's shouldSendQuizInactivityAlert) knows the user hasn't gone quiet. */
  quizActivityStorage: QuizActivityStorage;
  /** Clock for answeredAt, injectable for deterministic tests. Defaults to the real time. */
  now?: () => string;
}

export interface QuizSession {
  /** Generates 3-5 questions drawing on the given required competencies and the LLM Wiki. */
  generateQuestions(competencies: string[]): Promise<QuizQuestion[]>;
  /** Grades the answer, persists the result, and folds the score into the 퀴즈 점수 향상 KPI. */
  submitAnswer(input: SubmitAnswerInput): Promise<QuizAnswerRecord>;
}

export function createQuizSession(deps: QuizSessionDeps): QuizSession {
  const now = deps.now ?? (() => new Date().toISOString());

  return {
    async generateQuestions(competencies) {
      const wikiItems = await deps.wikiReader.list();
      const wikiNotes = wikiItems.map((item) => item.text);
      const candidates = await deps.questionClient.generate({ competencies, wikiNotes });
      return candidates.map((candidate, index) => ({ id: `q${index}`, ...candidate }));
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

      return record;
    },
  };
}
