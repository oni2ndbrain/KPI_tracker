import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { createFsWikiReader } from "../index.js";

let tmpDir: string | undefined;

afterEach(async () => {
  if (tmpDir) await rm(tmpDir, { recursive: true, force: true });
  tmpDir = undefined;
});

async function wikiFolders() {
  tmpDir = await mkdtemp(join(tmpdir(), "evidence-source-wiki-"));
  const notesFolder = join(tmpDir, "notes");
  const conversationsFolder = join(tmpDir, "conversations");
  await mkdir(notesFolder, { recursive: true });
  await mkdir(conversationsFolder, { recursive: true });
  return { notesFolder, conversationsFolder };
}

describe("createFsWikiReader", () => {
  test("reads notes and conversation transcripts, tagged with their respective source type", async () => {
    const { notesFolder, conversationsFolder } = await wikiFolders();
    await writeFile(join(notesFolder, "samsung-jd-analysis.md"), "# 삼성전자 JD 분석\nSPC 경험 정리");
    await writeFile(join(conversationsFolder, "2026-08-01.md"), "Claude와 나눈 대화: 수율 개선 아이디어");

    const items = await createFsWikiReader({ notesFolder, conversationsFolder }).list();

    expect(items).toHaveLength(2);
    const note = items.find((item) => item.sourceType === "wiki-note");
    expect(note?.sourceId).toBe("samsung-jd-analysis.md");
    expect(note?.text).toContain("SPC 경험 정리");
    const conversation = items.find((item) => item.sourceType === "wiki-conversation");
    expect(conversation?.text).toContain("수율 개선 아이디어");
  });

  test("recurses into subfolders, using the path relative to the scanned folder as the source id", async () => {
    const { notesFolder, conversationsFolder } = await wikiFolders();
    await mkdir(join(notesFolder, "companies"), { recursive: true });
    await writeFile(join(notesFolder, "companies", "skhynix.md"), "SK하이닉스 메모리 공정 노트");

    const items = await createFsWikiReader({ notesFolder, conversationsFolder }).list();

    expect(items).toEqual([
      expect.objectContaining({ sourceId: "companies/skhynix.md", sourceType: "wiki-note" }),
    ]);
  });

  test("ignores non-text files", async () => {
    const { notesFolder, conversationsFolder } = await wikiFolders();
    await writeFile(join(notesFolder, "diagram.png"), Buffer.from([0, 1, 2]));
    await writeFile(join(notesFolder, "note.md"), "실제 노트");

    const items = await createFsWikiReader({ notesFolder, conversationsFolder }).list();

    expect(items.map((item) => item.sourceId)).toEqual(["note.md"]);
  });
});
