import type { QuizAnswerRecord, QuizQuestion, WeakItem } from "./types.js";

// Scores below this on the 1-5 grading scale count as "틀림" for weak-item tracking and question
// reuse — a separate notion from the KPI's own continuous quiz-score average.
const WRONG_SCORE_THRESHOLD = 3;
const WEAK_ITEM_STREAK = 2;

export function isWrongAnswer(record: QuizAnswerRecord): boolean {
  return record.score < WRONG_SCORE_THRESHOLD;
}

function sortedByAnsweredAt(records: QuizAnswerRecord[]): QuizAnswerRecord[] {
  return [...records].sort((a, b) => (a.answeredAt < b.answeredAt ? -1 : a.answeredAt > b.answeredAt ? 1 : 0));
}

function groupByCompetency(records: QuizAnswerRecord[]): Map<string, QuizAnswerRecord[]> {
  const groups = new Map<string, QuizAnswerRecord[]>();
  for (const record of records) {
    const list = groups.get(record.competency) ?? [];
    list.push(record);
    groups.set(record.competency, list);
  }
  return groups;
}

/** Competencies whose most recent answers (in answeredAt order) ended on a streak of 2+ wrong
 * answers in a row. A correct answer resets that competency's streak. */
export function computeWeakItems(answers: QuizAnswerRecord[]): WeakItem[] {
  const weakItems: WeakItem[] = [];
  for (const [competency, records] of groupByCompetency(answers)) {
    let streak = 0;
    for (const record of sortedByAnsweredAt(records)) {
      streak = isWrongAnswer(record) ? streak + 1 : 0;
    }
    if (streak >= WEAK_ITEM_STREAK) {
      weakItems.push({ competency, consecutiveWrongCount: streak });
    }
  }
  return weakItems.sort((a, b) => a.competency.localeCompare(b.competency));
}

/** Questions whose most recent attempt was wrong — due to reappear in the next quiz session.
 * One entry per questionId, keyed off that question's latest attempt so a since-corrected
 * question drops off the list. */
export function outstandingWrongQuestions(answers: QuizAnswerRecord[]): QuizQuestion[] {
  const latestByQuestion = new Map<string, QuizAnswerRecord>();
  for (const record of sortedByAnsweredAt(answers)) {
    latestByQuestion.set(record.questionId, record);
  }
  return [...latestByQuestion.values()]
    .filter(isWrongAnswer)
    .map((record) => ({ id: record.questionId, competency: record.competency, prompt: record.questionPrompt }));
}
