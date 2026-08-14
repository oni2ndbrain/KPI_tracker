import type { Achievement } from "../../../kpi-engine/index.js";
import type { AchievementStorage } from "../../../kpi-storage/index.js";

/** In-memory stand-in for AchievementStorage, used only in tests — never touches Google Drive. */
export function createFakeAchievementStorage(): AchievementStorage {
  const achievements = new Map<string, Achievement>();

  return {
    async save(achievement) {
      achievements.set(achievement.id, achievement);
    },
    async deleteBySourceId(sourceId) {
      for (const [id, achievement] of achievements) {
        if (achievement.sourceId === sourceId) achievements.delete(id);
      }
    },
    async list() {
      return [...achievements.values()];
    },
  };
}
