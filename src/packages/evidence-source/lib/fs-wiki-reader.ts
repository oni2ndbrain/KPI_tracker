import { createFsTextFolderReader } from "./fs-text-folder-reader.js";
import type { EvidenceItemReader } from "./types.js";

export interface WikiFolders {
  notesFolder: string;
  conversationsFolder: string;
}

/** Production EvidenceItemReader for the LLM Wiki: combines notes with exported Claude
 * conversation transcripts, both read as plain markdown/text from their respective folders. */
export function createFsWikiReader({ notesFolder, conversationsFolder }: WikiFolders): EvidenceItemReader {
  const notesReader = createFsTextFolderReader(notesFolder, "wiki-note");
  const conversationsReader = createFsTextFolderReader(conversationsFolder, "wiki-conversation");

  return {
    async list() {
      const [notes, conversations] = await Promise.all([notesReader.list(), conversationsReader.list()]);
      return [...notes, ...conversations];
    },
  };
}
