import type { KpiState } from "../../kpi-engine/index.js";
import type { DriveClient } from "./drive-client.js";

const TRACKER_FOLDER_NAME = "KPI_tracker";

export interface KpiStorage {
  save(kpi: KpiState): Promise<void>;
  load(kpiId: string): Promise<KpiState | null>;
}

async function trackerFolderId(drive: DriveClient): Promise<string> {
  const existing = await drive.findFolder(TRACKER_FOLDER_NAME);
  if (existing) return existing;
  return drive.createFolder(TRACKER_FOLDER_NAME);
}

function fileNameFor(kpiId: string): string {
  return `${kpiId}.json`;
}

export function createKpiStorage(drive: DriveClient): KpiStorage {
  return {
    async save(kpi) {
      const folderId = await trackerFolderId(drive);
      const fileName = fileNameFor(kpi.definition.id);
      const content = JSON.stringify(kpi);

      const existingFileId = await drive.findFile(fileName, folderId);
      if (existingFileId) {
        await drive.updateFile(existingFileId, content);
      } else {
        await drive.createFile(fileName, folderId, content);
      }
    },

    async load(kpiId) {
      const folderId = await trackerFolderId(drive);
      const fileName = fileNameFor(kpiId);

      const fileId = await drive.findFile(fileName, folderId);
      if (!fileId) return null;

      const content = await drive.readFile(fileId);
      return JSON.parse(content) as KpiState;
    },
  };
}
