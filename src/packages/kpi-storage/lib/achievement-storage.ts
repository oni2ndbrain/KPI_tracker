import type { Achievement } from "../../kpi-engine/index.js";
import type { DriveClient } from "./drive-client.js";
import { readJsonArray, writeJsonArray } from "./json-blob-file.js";
import { trackerFolderId } from "./tracker-folder.js";

// One shared file rather than one-per-entity (kpi-storage.ts's convention) because DriveClient
// has no "list files in a folder" operation — listing achievements individually isn't possible
// without it, so they're kept together in a single array file instead.
const ACHIEVEMENTS_FILE_NAME = "achievements.json";

export interface AchievementStorage {
  /** Upserts by id — saving an id that already exists overwrites that entry rather than duplicating it. */
  save(achievement: Achievement): Promise<void>;
  /** Removes every stored achievement with the given sourceId, regardless of sourceVersion. Used
   * when a source is re-scanned, so achievements from its previous version don't linger as
   * orphans if the new version yields fewer candidates. */
  deleteBySourceId(sourceId: string): Promise<void>;
  list(): Promise<Achievement[]>;
}

export function createAchievementStorage(drive: DriveClient): AchievementStorage {
  return {
    async save(achievement) {
      const folderId = await trackerFolderId(drive);
      const { fileId, items: achievements } = await readJsonArray<Achievement>(drive, folderId, ACHIEVEMENTS_FILE_NAME);

      const next = achievements.filter((a) => a.id !== achievement.id);
      next.push(achievement);
      await writeJsonArray(drive, folderId, ACHIEVEMENTS_FILE_NAME, fileId, next);
    },

    async deleteBySourceId(sourceId) {
      const folderId = await trackerFolderId(drive);
      const { fileId, items: achievements } = await readJsonArray<Achievement>(drive, folderId, ACHIEVEMENTS_FILE_NAME);
      if (!fileId) return;

      const next = achievements.filter((a) => a.sourceId !== sourceId);
      await writeJsonArray(drive, folderId, ACHIEVEMENTS_FILE_NAME, fileId, next);
    },

    async list() {
      const folderId = await trackerFolderId(drive);
      const { items: achievements } = await readJsonArray<Achievement>(drive, folderId, ACHIEVEMENTS_FILE_NAME);
      return achievements;
    },
  };
}
