import type { TargetCompany } from "../../../kpi-engine/index.js";
import type { TargetCompanyStorage } from "../../../kpi-storage/index.js";

/** In-memory stand-in for TargetCompanyStorage, used only in tests — never touches Google Drive. */
export function createFakeTargetCompanyStorage(): TargetCompanyStorage {
  const companies = new Map<string, TargetCompany>();

  return {
    async save(company) {
      companies.set(company.id, company);
    },
    async list() {
      return [...companies.values()];
    },
  };
}
