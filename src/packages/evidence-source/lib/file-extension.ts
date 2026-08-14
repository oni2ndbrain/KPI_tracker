/** Lowercased extension including the dot (e.g. ".docx"), or "" for an extensionless name. */
export function fileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot).toLowerCase();
}
