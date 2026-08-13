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
