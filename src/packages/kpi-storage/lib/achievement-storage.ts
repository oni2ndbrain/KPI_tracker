import type { Achievement } from "../../kpi-engine/index.js";
import type { DriveClient } from "./drive-client.js";
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

async function readAll(drive: DriveClient, folderId: string): Promise<{ fileId: string | null; achievements: Achievement[] }> {
  const fileId = await drive.findFile(ACHIEVEMENTS_FILE_NAME, folderId);
  const achievements: Achievement[] = fileId
    ? (JSON.parse(await drive.readFile(fileId)) as Achievement[])
    : [];
  return { fileId, achievements };
}

async function writeAll(
  drive: DriveClient,
  folderId: string,
  fileId: string | null,
  achievements: Achievement[],
): Promise<void> {
  const content = JSON.stringify(achievements);
  if (fileId) {
    await drive.updateFile(fileId, content);
  } else {
    await drive.createFile(ACHIEVEMENTS_FILE_NAME, folderId, content);
  }
}

export function createAchievementStorage(drive: DriveClient): AchievementStorage {
  return {
    async save(achievement) {
      const folderId = await trackerFolderId(drive);
      const { fileId, achievements } = await readAll(drive, folderId);

      const next = achievements.filter((a) => a.id !== achievement.id);
      next.push(achievement);
      await writeAll(drive, folderId, fileId, next);
    },

    async deleteBySourceId(sourceId) {
      const folderId = await trackerFolderId(drive);
      const { fileId, achievements } = await readAll(drive, folderId);
      if (!fileId) return;

      const next = achievements.filter((a) => a.sourceId !== sourceId);
      await writeAll(drive, folderId, fileId, next);
    },

    async list() {
      const folderId = await trackerFolderId(drive);
      const { achievements } = await readAll(drive, folderId);
      return achievements;
    },
  };
}
