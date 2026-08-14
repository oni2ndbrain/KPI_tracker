import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { extractDocumentText } from "./document-parsers.js";
import { fileExtension } from "./file-extension.js";
import type { EvidenceItem, EvidenceItemReader } from "./types.js";

const SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".pptx", ".xlsx"];

/** Production EvidenceItemReader that scans a local folder of written documents (pdf/docx/pptx/xlsx)
 * and parses each into plain text. Non-recursive — only files directly inside the folder. */
export function createFsDocumentFolderReader(folderPath: string): EvidenceItemReader {
  return {
    async list() {
      const entries = await readdir(folderPath, { withFileTypes: true });
      const items: EvidenceItem[] = [];

      for (const entry of entries) {
        if (!entry.isFile()) continue;
        if (!SUPPORTED_EXTENSIONS.includes(fileExtension(entry.name))) continue;

        const filePath = join(folderPath, entry.name);
        const [buffer, fileStat] = await Promise.all([readFile(filePath), stat(filePath)]);
        const text = await extractDocumentText(entry.name, buffer);

        items.push({
          sourceId: entry.name,
          sourceVersion: fileStat.mtime.toISOString(),
          sourceType: "document",
          text,
        });
      }

      return items;
    },
  };
}
