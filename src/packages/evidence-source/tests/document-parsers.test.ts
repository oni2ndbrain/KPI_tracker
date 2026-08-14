import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { extractDocumentText } from "../index.js";

const fixturePath = (name: string) => fileURLToPath(new URL(`fixtures/${name}`, import.meta.url));

describe("extractDocumentText", () => {
  test("extracts paragraph text from a .docx file", async () => {
    const buffer = await readFile(fixturePath("sample.docx"));

    const text = await extractDocumentText("sample.docx", buffer);

    expect(text).toContain("반도체 공정 데이터 분석으로 수율을 2% 개선한 프로젝트를 리드했다.");
    expect(text).toContain("SPC 관리도를 도입해 불량률 이상 감지 시간을 단축했다.");
  });

  test("extracts slide text from a .pptx file, in slide order", async () => {
    const buffer = await readFile(fixturePath("sample.pptx"));

    const text = await extractDocumentText("sample.pptx", buffer);

    const firstSlideIndex = text.indexOf("AX 포트폴리오 프로젝트 발표");
    const secondSlideIndex = text.indexOf("목표 회사 갭 분석 결과 공유");
    expect(firstSlideIndex).toBeGreaterThanOrEqual(0);
    expect(secondSlideIndex).toBeGreaterThan(firstSlideIndex);
  });

  test("extracts cell text from an .xlsx file", async () => {
    const buffer = await readFile(fixturePath("sample.xlsx"));

    const text = await extractDocumentText("sample.xlsx", buffer);

    expect(text).toContain("지원 건수");
    expect(text).toContain("퀴즈 평균 점수");
    expect(text).toContain("3.8");
  });

  test("extracts page text from a .pdf file", async () => {
    const buffer = await readFile(fixturePath("sample.pdf"));

    const text = await extractDocumentText("sample.pdf", buffer);

    expect(text).toContain("2026 AX portfolio evidence-source ticket");
  });

  test("rejects an unsupported file extension", async () => {
    await expect(extractDocumentText("notes.txt", Buffer.from("hi"))).rejects.toThrow(
      /unsupported document format/,
    );
  });

  test("rejects a .docx file with invalid content", async () => {
    await expect(extractDocumentText("broken.docx", Buffer.from("not a zip"))).rejects.toThrow();
  });
});
