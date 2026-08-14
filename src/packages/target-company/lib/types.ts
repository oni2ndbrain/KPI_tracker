export interface JdExtractionResult {
  competencies: string[];
  deadline: string;
}

export interface TargetCompany {
  id: string;
  name: string;
  requiredCompetencies: string[];
  deadline: string;
  /** Required competencies with no related material found in the LLM Wiki. */
  gap: string[];
  kpiId: string;
}
