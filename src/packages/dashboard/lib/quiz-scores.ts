import type { QuizAnswerRecord } from "../../kpi-engine/index.js";
import type { QuizCompetencyScore } from "./types.js";

/** One entry per competency that has ever been quizzed, averaging every recorded answer score
 * for that competency — unlike competency-gap.ts, this isn't limited to a target company's
 * required competencies, since the 역량 진단 panel shows everything quizzed so far. */
export function buildQuizCompetencyScores(quizAnswers: QuizAnswerRecord[]): QuizCompetencyScore[] {
  const scoresByCompetency = new Map<string, number[]>();
  for (const answer of quizAnswers) {
    const scores = scoresByCompetency.get(answer.competency) ?? [];
    scores.push(answer.score);
    scoresByCompetency.set(answer.competency, scores);
  }

  return [...scoresByCompetency.entries()].map(([competency, scores]) => ({
    competency,
    score: scores.reduce((sum, score) => sum + score, 0) / scores.length,
  }));
}
