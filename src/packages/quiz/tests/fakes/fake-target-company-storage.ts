import type { TargetCompany } from "../../../kpi-engine/index.js";
import type { TargetCompanyStorage } from "../../../kpi-storage/index.js";

/** In-memory stand-in for TargetCompanyStorage, used only in tests — never touches Google Drive. */
export function createFakeTargetCompanyStorage(seed: TargetCompany[] = []): TargetCompanyStorage {
  const companies = new Map<string, TargetCompany>(seed.map((company) => [company.id, company]));

  return {
    async save(company) {
      companies.set(company.id, company);
    },
    async list() {
      return [...companies.values()];
    },
  };
}
