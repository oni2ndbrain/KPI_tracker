import type { DriveClient } from "../../lib/drive-client.js";

/** In-memory stand-in for Google Drive, used only in tests — never talks to the network. */
export function createInMemoryDriveClient(): DriveClient {
  const folders = new Map<string, string>(); // "parentId|name" -> folderId
  const files = new Map<string, { parentId: string; name: string; content: string }>(); // fileId -> file
  let nextId = 1;
  const freshId = () => `fake-id-${nextId++}`;

  function folderKey(name: string, parentId?: string) {
    return `${parentId ?? "root"}|${name}`;
  }

  return {
    async findFolder(name, parentId) {
      return folders.get(folderKey(name, parentId)) ?? null;
    },
    async createFolder(name, parentId) {
      const id = freshId();
      folders.set(folderKey(name, parentId), id);
      return id;
    },
    async findFile(name, parentId) {
      for (const [fileId, file] of files) {
        if (file.parentId === parentId && file.name === name) return fileId;
      }
      return null;
    },
    async createFile(name, parentId, content) {
      const id = freshId();
      files.set(id, { parentId, name, content });
      return id;
    },
    async updateFile(fileId, content) {
      const file = files.get(fileId);
      if (!file) throw new Error(`no such file: ${fileId}`);
      file.content = content;
    },
    async readFile(fileId) {
      const file = files.get(fileId);
      if (!file) throw new Error(`no such file: ${fileId}`);
      return file.content;
    },
  };
}
