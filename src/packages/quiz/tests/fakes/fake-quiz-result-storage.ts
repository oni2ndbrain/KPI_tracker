import type { QuizAnswerRecord } from "../../../kpi-engine/index.js";
import type { QuizResultStorage } from "../../../kpi-storage/index.js";

/** In-memory stand-in for QuizResultStorage, used only in tests — never touches Google Drive. */
export function createFakeQuizResultStorage(): QuizResultStorage {
  const records = new Map<string, QuizAnswerRecord>();

  return {
    async save(record) {
      records.set(record.id, record);
    },
    async list() {
      return [...records.values()];
    },
  };
}
