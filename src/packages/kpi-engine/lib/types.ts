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

export interface ApplicationPeriod {
  /** ISO date (YYYY-MM-DD) */
  start: string;
  /** ISO date (YYYY-MM-DD) */
  end: string;
}

export interface TargetCompany {
  id: string;
  name: string;
  requiredCompetencies: string[];
  /** ISO date (YYYY-MM-DD) — the application deadline, and the basis for D-14/D-7/D-1 alerts. */
  deadline: string;
  /** Required competencies with no related material found in the LLM Wiki. */
  gap: string[];
  kpiId: string;
  /** The application period as entered by hand in the user's Google Calendar, read back in via
   * the calendar adapter's sync — null until a matching calendar entry has been found. */
  applicationPeriod: ApplicationPeriod | null;
}

/** A generated 역량 진단 퀴즈 question, not yet answered. */
export interface QuizQuestion {
  id: string;
  /** The required competency this question probes. */
  competency: string;
  prompt: string;
}

/** A graded answer to one QuizQuestion, as persisted. Whether the id came from voice-to-text
 * dictation or direct typing is irrelevant here — grading treats both identically. */
export interface QuizAnswerRecord {
  id: string;
  questionId: string;
  competency: string;
  questionPrompt: string;
  answerText: string;
  /** 1-5. */
  score: number;
  referencesPersonalExperience: boolean;
  /** True when the answer follows 현상 → 후속공정 영향 → 원인 → 해결 structure. */
  isStructured: boolean;
  answeredAt: string;
}

/** A competency whose most recent quiz answers ended on a streak of 2+ wrong answers in a row —
 * see weak-item.ts's computeWeakItems. */
export interface WeakItem {
  competency: string;
  consecutiveWrongCount: number;
}

/** Where to study to close a weak item's gap — the LLM Wiki first if related material already
 * exists there, a freshly found source otherwise. */
export interface StudyRecommendation {
  source: "llm-wiki" | "web-search";
  title: string;
  /** A wiki note reference when source is "llm-wiki"; a URL or search description when "web-search". */
  reference: string;
}

export interface WeakItemReport extends WeakItem {
  recommendation: StudyRecommendation;
}
