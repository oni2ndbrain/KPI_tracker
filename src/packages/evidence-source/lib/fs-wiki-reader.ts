import { createFsTextFolderReader } from "./fs-text-folder-reader.js";
import type { EvidenceItemReader } from "./types.js";

export interface WikiFolders {
  notesFolder: string;
  /** Exported Claude conversation transcripts. Omit if that folder doesn't exist yet — notes
   * alone are still a useful signal, and scanning a folder that isn't there would just throw. */
  conversationsFolder?: string;
}

/** Production EvidenceItemReader for the LLM Wiki: combines notes with exported Claude
 * conversation transcripts, both read as plain markdown/text from their respective folders. */
export function createFsWikiReader({ notesFolder, conversationsFolder }: WikiFolders): EvidenceItemReader {
  const notesReader = createFsTextFolderReader(notesFolder, "wiki-note");
  const conversationsReader = conversationsFolder
    ? createFsTextFolderReader(conversationsFolder, "wiki-conversation")
    : undefined;

  return {
    async list() {
      const [notes, conversations] = await Promise.all([
        notesReader.list(),
        conversationsReader?.list() ?? Promise.resolve([]),
      ]);
      return [...notes, ...conversations];
    },
  };
}
