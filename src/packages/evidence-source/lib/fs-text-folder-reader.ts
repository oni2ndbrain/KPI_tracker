import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import type { AchievementSourceType } from "../../kpi-engine/index.js";
import { fileExtension } from "./file-extension.js";
import type { EvidenceItem, EvidenceItemReader } from "./types.js";

const TEXT_EXTENSIONS = [".md", ".txt"];

/** Recursively scans a folder for plain-text/markdown files — LLM Wiki notes or exported Claude
 * conversation transcripts — and reads each verbatim, no format parsing needed. */
export function createFsTextFolderReader(
  folderPath: string,
  sourceType: AchievementSourceType,
): EvidenceItemReader {
  return {
    async list() {
      return scanFolder(folderPath, folderPath, sourceType);
    },
  };
}

async function scanFolder(
  root: string,
  dir: string,
  sourceType: AchievementSourceType,
): Promise<EvidenceItem[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const items: EvidenceItem[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      items.push(...(await scanFolder(root, fullPath, sourceType)));
      continue;
    }

    if (!TEXT_EXTENSIONS.includes(fileExtension(entry.name))) continue;

    const [text, fileStat] = await Promise.all([readFile(fullPath, "utf-8"), stat(fullPath)]);
    items.push({
      sourceId: relative(root, fullPath).split(sep).join("/"),
      sourceVersion: fileStat.mtime.toISOString(),
      sourceType,
      text,
    });
  }

  return items;
}
