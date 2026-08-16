import { createKpi, recordProgress } from "../../kpi-engine/index.js";
import type { TargetCompany } from "../../kpi-engine/index.js";
import type { KpiStorage, TargetCompanyStorage } from "../../kpi-storage/index.js";
import type { JdExtractionClient } from "./jd-extraction-client.js";
import type { LlmWikiSearch } from "./llm-wiki-search.js";

export interface RegisterTargetCompanyInput {
  id: string;
  name: string;
  jdText: string;
}

export interface TargetCompanyTracker {
  register(input: RegisterTargetCompanyInput): Promise<TargetCompany>;
  get(id: string): TargetCompany | undefined;
  list(): TargetCompany[];
}

export interface TargetCompanyTrackerDeps {
  jdExtractor: JdExtractionClient;
  wikiSearch: LlmWikiSearch;
  kpiStorage: KpiStorage;
  /** Persists the registered TargetCompany record (name, deadline, gap) itself — kpiStorage only
   * persists its derived KPI, so a separate cloud job (e.g. deadline alerts) can enumerate
   * target companies without this repo's in-memory-only tracker instance still being alive. */
  targetCompanyStorage: TargetCompanyStorage;
}

function competencyFillKpiIdFor(targetCompanyId: string): string {
  return `${targetCompanyId}-competency-fill`;
}

export function createTargetCompanyTracker(deps: TargetCompanyTrackerDeps): TargetCompanyTracker {
  const companies = new Map<string, TargetCompany>();

  return {
    async register({ id, name, jdText }) {
      const { competencies, deadline } = await deps.jdExtractor.extract(jdText);
      const covered = new Set(await deps.wikiSearch.covered(competencies));
      const gap = competencies.filter((competency) => !covered.has(competency));

      const kpiId = competencyFillKpiIdFor(id);
      const freshKpi = createKpi({
        id: kpiId,
        name: `${name} 역량 채우기`,
        category: "competency-fill",
        target: competencies.length,
      });
      // Seed initial progress from competencies the LLM Wiki already covers, so registering
      // a target company doesn't start its KPI back at zero for ground already covered.
      const kpi =
        covered.size > 0
          ? recordProgress(freshKpi, { category: "competency-fill", amount: covered.size })
          : freshKpi;
      await deps.kpiStorage.save(kpi);

      const targetCompany: TargetCompany = {
        id,
        name,
        requiredCompetencies: competencies,
        deadline,
        gap,
        kpiId,
      };
      companies.set(id, targetCompany);
      await deps.targetCompanyStorage.save(targetCompany);
      return targetCompany;
    },

    get(id) {
      return companies.get(id);
    },

    list() {
      return [...companies.values()];
    },
  };
}
