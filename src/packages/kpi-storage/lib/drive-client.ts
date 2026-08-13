/**
 * The narrow surface kpi-storage depends on. Production code talks to real Google Drive
 * through an implementation of this; tests use an in-memory fake — neither ever calls the
 * real API in a test run.
 */
export interface DriveClient {
  findFolder(name: string, parentId?: string): Promise<string | null>;
  createFolder(name: string, parentId?: string): Promise<string>;
  findFile(name: string, parentId: string): Promise<string | null>;
  createFile(name: string, parentId: string, content: string): Promise<string>;
  updateFile(fileId: string, content: string): Promise<void>;
  readFile(fileId: string): Promise<string>;
}
