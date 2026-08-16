import type { TargetCompany } from "../../kpi-engine/index.js";
import type { DriveClient } from "./drive-client.js";
import { readJsonArray, writeJsonArray } from "./json-blob-file.js";
import { trackerFolderId } from "./tracker-folder.js";

// One shared file rather than one-per-entity (kpi-storage.ts's convention), same reasoning as
// achievement-storage.ts: DriveClient has no "list files in a folder" operation.
const TARGET_COMPANIES_FILE_NAME = "target-companies.json";

export interface TargetCompanyStorage {
  /** Upserts by id — saving an id that already exists overwrites that entry rather than duplicating it. */
  save(company: TargetCompany): Promise<void>;
  list(): Promise<TargetCompany[]>;
}

export function createTargetCompanyStorage(drive: DriveClient): TargetCompanyStorage {
  return {
    async save(company) {
      const folderId = await trackerFolderId(drive);
      const { fileId, items } = await readJsonArray<TargetCompany>(drive, folderId, TARGET_COMPANIES_FILE_NAME);

      const next = items.filter((c) => c.id !== company.id);
      next.push(company);
      await writeJsonArray(drive, folderId, TARGET_COMPANIES_FILE_NAME, fileId, next);
    },

    async list() {
      const folderId = await trackerFolderId(drive);
      const { items } = await readJsonArray<TargetCompany>(drive, folderId, TARGET_COMPANIES_FILE_NAME);
      return items;
    },
  };
}
