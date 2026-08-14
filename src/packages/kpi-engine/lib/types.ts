export type KpiCategory =
  | "competency-fill"
  | "project-completion"
  | "activity-count"
  | "quiz-score";

export interface KpiDefinition {
  id: string;
  name: string;
  category: KpiCategory;
  target: number;
}

export interface KpiState {
  definition: KpiDefinition;
  /** Raw recorded values, in the order they were reported. Each category interprets these differently. */
  history: number[];
  currentValue: number;
  achievementRate: number;
}

export type ProgressEvent =
  | { category: "activity-count"; amount?: number }
  | { category: "project-completion"; percentage: number }
  | { category: "competency-fill"; amount?: number }
  | { category: "quiz-score"; score: number };

export type AchievementSourceType = "document" | "wiki-note" | "wiki-conversation";

export interface Achievement {
  id: string;
  /** Stable identifier of the originating evidence item (e.g. a file path), used together with
   * sourceVersion to detect whether this source has already been discovered. */
  sourceId: string;
  /** Changes whenever the source content changes (e.g. a file's modified time), so an edited
   * source is re-scanned instead of being skipped as a duplicate. */
  sourceVersion: string;
  sourceType: AchievementSourceType;
  title: string;
  description: string;
  discoveredAt: string;
}
