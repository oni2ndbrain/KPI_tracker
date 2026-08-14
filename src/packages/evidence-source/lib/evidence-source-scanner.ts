import type { Achievement } from "../../kpi-engine/index.js";
import type { AchievementStorage } from "../../kpi-storage/index.js";
import type { AchievementExtractionClient } from "./achievement-extraction-client.js";
import type { EvidenceItem, EvidenceItemReader } from "./types.js";

export interface EvidenceSourceScannerDeps {
  documentReader: EvidenceItemReader;
  wikiReader: EvidenceItemReader;
  extractionClient: AchievementExtractionClient;
  achievementStorage: AchievementStorage;
  /** Clock for discoveredAt, injectable for deterministic tests. Defaults to the real time. */
  now?: () => string;
}

export interface EvidenceSourceScanner {
  /** Scans every configured evidence source and returns only the achievements newly saved this
   * run — sources already covered by a stored achievement with the same sourceId+sourceVersion
   * are skipped rather than re-extracted. A source that yields zero candidates has no stored
   * achievement to key off, so it will be re-extracted on the next scan until it does. */
  scan(): Promise<Achievement[]>;
}

function sourceKey(sourceId: string, sourceVersion: string): string {
  return `${sourceId}@${sourceVersion}`;
}

export function createEvidenceSourceScanner(deps: EvidenceSourceScannerDeps): EvidenceSourceScanner {
  const now = deps.now ?? (() => new Date().toISOString());

  return {
    async scan() {
      const [documentItems, wikiItems, existingAchievements] = await Promise.all([
        deps.documentReader.list(),
        deps.wikiReader.list(),
        deps.achievementStorage.list(),
      ]);

      const alreadyDiscovered = new Set(
        existingAchievements.map((a) => sourceKey(a.sourceId, a.sourceVersion)),
      );
      const unseenItems: EvidenceItem[] = [...documentItems, ...wikiItems].filter(
        (item) => !alreadyDiscovered.has(sourceKey(item.sourceId, item.sourceVersion)),
      );

      const discovered: Achievement[] = [];
      for (const item of unseenItems) {
        const candidates = await deps.extractionClient.extract(item.text);
        const achievements = candidates.map(
          (candidate, index): Achievement => ({
            id: `${item.sourceId}#${index}`,
            sourceId: item.sourceId,
            sourceVersion: item.sourceVersion,
            sourceType: item.sourceType,
            title: candidate.title,
            description: candidate.description,
            discoveredAt: now(),
          }),
        );

        // Clear out achievements from this source's previous version first, so a re-scan that
        // yields fewer candidates than before doesn't leave the extra ones behind as orphans.
        await deps.achievementStorage.deleteBySourceId(item.sourceId);
        for (const achievement of achievements) {
          await deps.achievementStorage.save(achievement);
        }
        discovered.push(...achievements);
      }

      return discovered;
    },
  };
}
