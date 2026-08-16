import type { QuizActivityStorage } from "../../../kpi-storage/index.js";

/** In-memory stand-in for QuizActivityStorage, used only in tests — never touches Google Drive. */
export function createFakeQuizActivityStorage(): QuizActivityStorage {
  let lastCompletedAt: string | null = null;

  return {
    async recordCompletion(completedAt) {
      lastCompletedAt = completedAt;
    },
    async lastCompletedAt() {
      return lastCompletedAt;
    },
  };
}
