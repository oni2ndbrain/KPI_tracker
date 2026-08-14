import type { KpiState } from "../../kpi-engine/index.js";
import type { DriveClient } from "./drive-client.js";
import { trackerFolderId } from "./tracker-folder.js";

// Tracks every KPI id ever saved, so list() can enumerate them without a "list files in a
// folder" DriveClient operation (see achievement-storage.ts for the same constraint).
const INDEX_FILE_NAME = "kpi-index.json";

export interface KpiStorage {
  save(kpi: KpiState): Promise<void>;
  load(kpiId: string): Promise<KpiState | null>;
  list(): Promise<KpiState[]>;
}

function fileNameFor(kpiId: string): string {
  return `${kpiId}.json`;
}

async function readIndex(drive: DriveClient, folderId: string): Promise<{ fileId: string | null; ids: string[] }> {
  const fileId = await drive.findFile(INDEX_FILE_NAME, folderId);
  const ids: string[] = fileId ? (JSON.parse(await drive.readFile(fileId)) as string[]) : [];
  return { fileId, ids };
}

async function addToIndex(drive: DriveClient, folderId: string, kpiId: string): Promise<void> {
  const { fileId, ids } = await readIndex(drive, folderId);
  if (ids.includes(kpiId)) return;

  const content = JSON.stringify([...ids, kpiId]);
  if (fileId) {
    await drive.updateFile(fileId, content);
  } else {
    await drive.createFile(INDEX_FILE_NAME, folderId, content);
  }
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

      await addToIndex(drive, folderId, kpi.definition.id);
    },

    async load(kpiId) {
      const folderId = await trackerFolderId(drive);
      const fileName = fileNameFor(kpiId);

      const fileId = await drive.findFile(fileName, folderId);
      if (!fileId) return null;

      const content = await drive.readFile(fileId);
      return JSON.parse(content) as KpiState;
    },

    async list() {
      const folderId = await trackerFolderId(drive);
      const { ids } = await readIndex(drive, folderId);

      const kpis = await Promise.all(
        ids.map(async (kpiId) => {
          const fileName = fileNameFor(kpiId);
          const fileId = await drive.findFile(fileName, folderId);
          if (!fileId) return null;
          return JSON.parse(await drive.readFile(fileId)) as KpiState;
        }),
      );
      return kpis.filter((kpi): kpi is KpiState => kpi !== null);
    },
  };
}
