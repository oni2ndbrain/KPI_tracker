/** A generated question candidate, not yet assigned a QuizQuestion id. */
export interface QuizQuestionCandidate {
  competency: string;
  prompt: string;
}

export interface QuizGradingResult {
  /** 1-5. */
  score: number;
  referencesPersonalExperience: boolean;
  /** True when the answer follows 현상 → 후속공정 영향 → 원인 → 해결 structure. */
  isStructured: boolean;
}
