import type { DriveClient } from "./drive-client.js";

/** Reads a single JSON-array file from a Drive folder, defaulting to an empty array if it
 * doesn't exist yet. Shared by every file in this package that keeps its records as one array
 * blob (kpi-index.json, achievements.json) rather than one file per record. */
export async function readJsonArray<T>(
  drive: DriveClient,
  folderId: string,
  fileName: string,
): Promise<{ fileId: string | null; items: T[] }> {
  const fileId = await drive.findFile(fileName, folderId);
  const items: T[] = fileId ? (JSON.parse(await drive.readFile(fileId)) as T[]) : [];
  return { fileId, items };
}

export async function writeJsonArray<T>(
  drive: DriveClient,
  folderId: string,
  fileName: string,
  fileId: string | null,
  items: T[],
): Promise<void> {
  const content = JSON.stringify(items);
  if (fileId) {
    await drive.updateFile(fileId, content);
  } else {
    await drive.createFile(fileName, folderId, content);
  }
}
