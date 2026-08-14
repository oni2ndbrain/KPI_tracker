import type { AchievementSourceType } from "../../kpi-engine/index.js";

/** An achievement extracted from source text, not yet assigned an id or linked to its source. */
export interface AchievementCandidate {
  title: string;
  description: string;
}

/** A unit of scannable evidence — one document file, one wiki note, or one conversation log —
 * reduced to its plain text plus enough identity to dedup against previously discovered achievements. */
export interface EvidenceItem {
  sourceId: string;
  sourceVersion: string;
  sourceType: AchievementSourceType;
  text: string;
}

export interface EvidenceItemReader {
  list(): Promise<EvidenceItem[]>;
}
