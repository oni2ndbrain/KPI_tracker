import type { DriveClient } from "./drive-client.js";
import { readJsonArray, writeJsonArray } from "./json-blob-file.js";
import { trackerFolderId } from "./tracker-folder.js";

// A single ISO timestamp, kept as a 0/1-element array so it can reuse the existing
// readJsonArray/writeJsonArray helpers rather than adding a separate single-value blob shape.
const QUIZ_ACTIVITY_FILE_NAME = "quiz-activity.json";

export interface QuizActivityStorage {
  /** Records that a quiz session was just completed, overwriting whatever "last completed"
   * timestamp was there before — only the most recent completion matters for inactivity checks. */
  recordCompletion(completedAt: string): Promise<void>;
  /** ISO timestamp of the most recently completed quiz session, or null if none has ever been recorded. */
  lastCompletedAt(): Promise<string | null>;
}

export function createQuizActivityStorage(drive: DriveClient): QuizActivityStorage {
  return {
    async recordCompletion(completedAt) {
      const folderId = await trackerFolderId(drive);
      const { fileId } = await readJsonArray<string>(drive, folderId, QUIZ_ACTIVITY_FILE_NAME);
      await writeJsonArray(drive, folderId, QUIZ_ACTIVITY_FILE_NAME, fileId, [completedAt]);
    },

    async lastCompletedAt() {
      const folderId = await trackerFolderId(drive);
      const { items } = await readJsonArray<string>(drive, folderId, QUIZ_ACTIVITY_FILE_NAME);
      return items[0] ?? null;
    },
  };
}
