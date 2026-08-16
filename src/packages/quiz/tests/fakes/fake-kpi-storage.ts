import type { KpiState } from "../../../kpi-engine/index.js";
import type { KpiStorage } from "../../../kpi-storage/index.js";

/** In-memory stand-in for KpiStorage, used only in tests — never touches Google Drive. */
export function createFakeKpiStorage(): KpiStorage {
  const kpis = new Map<string, KpiState>();

  return {
    async save(kpi) {
      kpis.set(kpi.definition.id, kpi);
    },
    async load(kpiId) {
      return kpis.get(kpiId) ?? null;
    },
    async list() {
      return [...kpis.values()];
    },
  };
}
