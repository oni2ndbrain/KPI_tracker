import type { QuizAnswerRecord, TargetCompany } from "../../kpi-engine/index.js";
import type { CompetencyGapPoint } from "./types.js";

function averageScoreFor(competency: string, quizAnswers: QuizAnswerRecord[]): number | null {
  const scores = quizAnswers.filter((answer) => answer.competency === competency).map((answer) => answer.score);
  if (scores.length === 0) return null;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

/** One point per required competency across all target companies (deduped). Held score comes
 * from the quiz's own scoring (1-5, scaled to 0-100) where the competency has been quizzed at
 * least once; otherwise it falls back to the target company's own binary gap analysis (0 if
 * flagged as missing, 100 if not) since that's the only signal available yet. */
export function buildCompetencyGapPoints(
  companies: TargetCompany[],
  quizAnswers: QuizAnswerRecord[],
): CompetencyGapPoint[] {
  const inGapByCompetency = new Map<string, boolean>();
  for (const company of companies) {
    for (const competency of company.requiredCompetencies) {
      const alreadyFlagged = inGapByCompetency.get(competency) ?? false;
      inGapByCompetency.set(competency, alreadyFlagged || company.gap.includes(competency));
    }
  }

  return [...inGapByCompetency.entries()].map(([competency, inGap]) => {
    const avgScore = averageScoreFor(competency, quizAnswers);
    const heldScore = avgScore !== null ? Math.round((avgScore / 5) * 100) : inGap ? 0 : 100;
    return { competency, requiredScore: 100, heldScore };
  });
}
