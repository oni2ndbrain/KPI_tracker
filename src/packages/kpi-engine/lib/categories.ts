import type { KpiCategory } from "./types.js";

/** Derives current value from the full recorded history, per category's own notion of "progress". */
export function currentValueFor(category: KpiCategory, history: number[]): number {
  switch (category) {
    case "activity-count":
    case "competency-fill":
      return history.reduce((sum, value) => sum + value, 0);
    case "project-completion":
      return history.length === 0 ? 0 : history[history.length - 1]!;
    case "quiz-score":
      return history.length === 0 ? 0 : history.reduce((sum, value) => sum + value, 0) / history.length;
  }
}
