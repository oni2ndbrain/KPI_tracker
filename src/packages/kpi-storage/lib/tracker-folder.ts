import type { DriveClient } from "./drive-client.js";

export const TRACKER_FOLDER_NAME = "KPI_tracker";

/** Finds (or creates, on first use) the shared "KPI_tracker" Drive folder every storage in this
 * package reads and writes to. */
export async function trackerFolderId(drive: DriveClient): Promise<string> {
  const existing = await drive.findFolder(TRACKER_FOLDER_NAME);
  if (existing) return existing;
  return drive.createFolder(TRACKER_FOLDER_NAME);
}
