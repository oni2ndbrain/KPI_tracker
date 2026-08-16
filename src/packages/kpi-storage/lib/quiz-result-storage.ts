import type { QuizAnswerRecord } from "../../kpi-engine/index.js";
import type { DriveClient } from "./drive-client.js";
import { readJsonArray, writeJsonArray } from "./json-blob-file.js";
import { trackerFolderId } from "./tracker-folder.js";

// One shared file rather than one-per-entity (kpi-storage.ts's convention), same reasoning as
// achievement-storage.ts: DriveClient has no "list files in a folder" operation.
const QUIZ_RESULTS_FILE_NAME = "quiz-results.json";

export interface QuizResultStorage {
  /** Upserts by id — saving an id that already exists overwrites that entry rather than duplicating it. */
  save(record: QuizAnswerRecord): Promise<void>;
  list(): Promise<QuizAnswerRecord[]>;
}

export function createQuizResultStorage(drive: DriveClient): QuizResultStorage {
  return {
    async save(record) {
      const folderId = await trackerFolderId(drive);
      const { fileId, items } = await readJsonArray<QuizAnswerRecord>(drive, folderId, QUIZ_RESULTS_FILE_NAME);

      const next = items.filter((r) => r.id !== record.id);
      next.push(record);
      await writeJsonArray(drive, folderId, QUIZ_RESULTS_FILE_NAME, fileId, next);
    },

    async list() {
      const folderId = await trackerFolderId(drive);
      const { items } = await readJsonArray<QuizAnswerRecord>(drive, folderId, QUIZ_RESULTS_FILE_NAME);
      return items;
    },
  };
}
