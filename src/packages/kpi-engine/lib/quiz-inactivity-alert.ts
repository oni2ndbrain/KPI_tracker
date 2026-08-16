import { daysBetween } from "./date-math.js";

const INACTIVITY_THRESHOLD_DAYS = 7;

export interface QuizInactivityInput {
  /** ISO timestamp of the most recently completed quiz session, or null if none has ever been taken. */
  lastQuizAt: string | null;
  /** ISO timestamp — "now", passed in rather than read from the clock so callers stay
   * deterministic and testable. */
  today: string;
  generatedAt?: string;
}

export interface QuizInactivityAlertData {
  /** null when a quiz has never been taken — there's no "since" to count from. */
  daysSinceLastQuiz: number | null;
  generatedAt: string;
}

function daysSince(fromIso: string, today: string): number {
  return Math.floor(daysBetween(fromIso, today));
}

/** True once 7+ days have passed since the last completed quiz, or if none has ever been taken. */
export function shouldSendQuizInactivityAlert(input: QuizInactivityInput): boolean {
  if (input.lastQuizAt === null) return true;
  return daysSince(input.lastQuizAt, input.today) >= INACTIVITY_THRESHOLD_DAYS;
}

export function buildQuizInactivityAlertData(input: QuizInactivityInput): QuizInactivityAlertData {
  return {
    daysSinceLastQuiz: input.lastQuizAt === null ? null : daysSince(input.lastQuizAt, input.today),
    generatedAt: input.generatedAt ?? new Date().toISOString(),
  };
}
