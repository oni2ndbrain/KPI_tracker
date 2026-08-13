import { drive } from "@googleapis/drive";
import type { DriveClient } from "./drive-client.js";
import type { OAuth2Client } from "./env-auth.js";

const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";

/** Real Google Drive-backed implementation of DriveClient. Never used in tests — see tests/fakes/. */
export function createGoogleApiDriveClient(auth: OAuth2Client): DriveClient {
  const client = drive({ version: "v3", auth });

  function scopedQuery(name: string, mimeType: string, parentId?: string): string {
    const parentClause = parentId ? ` and '${parentId}' in parents` : " and 'root' in parents";
    return `name = '${name}' and mimeType = '${mimeType}' and trashed = false${parentClause}`;
  }

  return {
    async findFolder(name, parentId) {
      const response = await client.files.list({
        q: scopedQuery(name, FOLDER_MIME_TYPE, parentId),
        fields: "files(id)",
      });
      return response.data.files?.[0]?.id ?? null;
    },

    async createFolder(name, parentId) {
      const response = await client.files.create({
        requestBody: {
          name,
          mimeType: FOLDER_MIME_TYPE,
          parents: parentId ? [parentId] : undefined,
        },
        fields: "id",
      });
      if (!response.data.id) throw new Error(`Drive did not return an id for created folder "${name}"`);
      return response.data.id;
    },

    async findFile(name, parentId) {
      const response = await client.files.list({
        q: scopedQuery(name, "application/json", parentId),
        fields: "files(id)",
      });
      return response.data.files?.[0]?.id ?? null;
    },

    async createFile(name, parentId, content) {
      const response = await client.files.create({
        requestBody: { name, parents: [parentId] },
        media: { mimeType: "application/json", body: content },
        fields: "id",
      });
      if (!response.data.id) throw new Error(`Drive did not return an id for created file "${name}"`);
      return response.data.id;
    },

    async updateFile(fileId, content) {
      await client.files.update({
        fileId,
        media: { mimeType: "application/json", body: content },
      });
    },

    async readFile(fileId) {
      const response = await client.files.get({ fileId, alt: "media" }, { responseType: "text" });
      return response.data as unknown as string;
    },
  };
}
