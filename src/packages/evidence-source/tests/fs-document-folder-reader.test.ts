import { mkdtemp, copyFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, test } from "vitest";
import { createFsDocumentFolderReader } from "../index.js";

const fixturePath = (name: string) => fileURLToPath(new URL(`fixtures/${name}`, import.meta.url));

let tmpDir: string | undefined;

afterEach(async () => {
  if (tmpDir) await rm(tmpDir, { recursive: true, force: true });
  tmpDir = undefined;
});

describe("createFsDocumentFolderReader", () => {
  test("parses every supported document in the folder into an evidence item", async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "evidence-source-docs-"));
    await copyFile(fixturePath("sample.docx"), join(tmpDir, "report.docx"));
    await copyFile(fixturePath("sample.pdf"), join(tmpDir, "notes.pdf"));

    const items = await createFsDocumentFolderReader(tmpDir).list();

    expect(items).toHaveLength(2);
    const docx = items.find((item) => item.sourceId === "report.docx");
    expect(docx?.sourceType).toBe("document");
    expect(docx?.text).toContain("수율을 2% 개선한 프로젝트를 리드했다");
    const pdf = items.find((item) => item.sourceId === "notes.pdf");
    expect(pdf?.text).toContain("2026 AX portfolio evidence-source ticket");
  });

  test("ignores files with unsupported extensions", async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "evidence-source-docs-"));
    await copyFile(fixturePath("sample.docx"), join(tmpDir, "report.docx"));
    await writeFile(join(tmpDir, "readme.txt"), "not a document to scan");

    const items = await createFsDocumentFolderReader(tmpDir).list();

    expect(items.map((item) => item.sourceId)).toEqual(["report.docx"]);
  });

  test("an empty folder yields no evidence items", async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "evidence-source-docs-"));

    expect(await createFsDocumentFolderReader(tmpDir).list()).toEqual([]);
  });
});
