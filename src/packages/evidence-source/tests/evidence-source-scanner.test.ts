import { describe, expect, test } from "vitest";
import { createEvidenceSourceScanner } from "../index.js";
import { createFakeAchievementStorage } from "./fakes/fake-achievement-storage.js";
import { createFakeEvidenceItemReader } from "./fakes/fake-evidence-item-reader.js";
import { createFixtureAchievementExtractionClient } from "./fakes/fixture-achievement-extraction-client.js";

const REPORT_TEXT = "이번 분기 수율 개선 프로젝트를 리드했다.";
const NOTE_TEXT = "SPC 관리도 기준을 새로 정의하고 문서화함.";

function scannerWithFixtures({
  documentItems = [
    { sourceId: "report.docx", sourceVersion: "v1", sourceType: "document" as const, text: REPORT_TEXT },
  ],
  wikiItems = [
    { sourceId: "spc-note.md", sourceVersion: "v1", sourceType: "wiki-note" as const, text: NOTE_TEXT },
  ],
  achievementStorage = createFakeAchievementStorage(),
  now = () => "2026-08-14T00:00:00.000Z",
} = {}) {
  const extractionClient = createFixtureAchievementExtractionClient({
    [REPORT_TEXT]: [{ title: "수율 개선 프로젝트 리드", description: REPORT_TEXT }],
    [NOTE_TEXT]: [{ title: "SPC 관리도 기준 재정의", description: NOTE_TEXT }],
    "관련 없는 내용": [],
  });
  const scanner = createEvidenceSourceScanner({
    documentReader: createFakeEvidenceItemReader(documentItems),
    wikiReader: createFakeEvidenceItemReader(wikiItems),
    extractionClient,
    achievementStorage,
    now,
  });
  return { scanner, achievementStorage };
}

describe("createEvidenceSourceScanner: scan", () => {
  test("extracts achievement candidates from both document and wiki evidence items", async () => {
    const { scanner } = scannerWithFixtures();

    const discovered = await scanner.scan();

    expect(discovered).toHaveLength(2);
    expect(discovered.map((a) => a.title)).toEqual(
      expect.arrayContaining(["수율 개선 프로젝트 리드", "SPC 관리도 기준 재정의"]),
    );
  });

  test("saves discovered achievements so they can be listed back from storage", async () => {
    const { scanner, achievementStorage } = scannerWithFixtures();

    await scanner.scan();

    const saved = await achievementStorage.list();
    expect(saved).toHaveLength(2);
  });

  test("stamps each achievement with its source's id, version, and type", async () => {
    const { scanner } = scannerWithFixtures();

    const [reportAchievement] = await scanner.scan();

    expect(reportAchievement).toMatchObject({
      id: "report.docx#0",
      sourceId: "report.docx",
      sourceVersion: "v1",
      sourceType: "document",
      discoveredAt: "2026-08-14T00:00:00.000Z",
    });
  });

  test("a source already covered by a stored achievement is not rediscovered", async () => {
    const { scanner, achievementStorage } = scannerWithFixtures();
    await scanner.scan();

    const secondRun = await scanner.scan();

    expect(secondRun).toEqual([]);
    expect(await achievementStorage.list()).toHaveLength(2);
  });

  test("a source whose version changed (edited note/document) is re-scanned", async () => {
    const achievementStorage = createFakeAchievementStorage();
    const { scanner } = scannerWithFixtures({ achievementStorage });
    await scanner.scan();

    const { scanner: rescan } = scannerWithFixtures({
      documentItems: [
        { sourceId: "report.docx", sourceVersion: "v2", sourceType: "document", text: REPORT_TEXT },
      ],
      wikiItems: [],
      achievementStorage,
    });
    const secondRun = await rescan.scan();

    expect(secondRun).toHaveLength(1);
    expect(secondRun[0]).toMatchObject({ sourceId: "report.docx", sourceVersion: "v2" });
  });

  test("a re-scanned source that now yields fewer candidates doesn't leave the old extras as orphans", async () => {
    const achievementStorage = createFakeAchievementStorage();
    const v1Text = "보고서 v1: 성과 2건을 기록함";
    const v2Text = "보고서 v2: 성과 1건으로 축약됨";
    const documentReader = createFakeEvidenceItemReader([
      { sourceId: "report.docx", sourceVersion: "v1", sourceType: "document", text: v1Text },
    ]);
    const scannerV1 = createEvidenceSourceScanner({
      documentReader,
      wikiReader: createFakeEvidenceItemReader([]),
      extractionClient: createFixtureAchievementExtractionClient({
        [v1Text]: [
          { title: "성과 A", description: "A" },
          { title: "성과 B", description: "B" },
        ],
      }),
      achievementStorage,
    });
    await scannerV1.scan();
    expect(await achievementStorage.list()).toHaveLength(2);

    const scannerV2 = createEvidenceSourceScanner({
      documentReader: createFakeEvidenceItemReader([
        { sourceId: "report.docx", sourceVersion: "v2", sourceType: "document", text: v2Text },
      ]),
      wikiReader: createFakeEvidenceItemReader([]),
      extractionClient: createFixtureAchievementExtractionClient({
        [v2Text]: [{ title: "성과 A", description: "A (수정됨)" }],
      }),
      achievementStorage,
    });
    await scannerV2.scan();

    const finalState = await achievementStorage.list();
    expect(finalState).toHaveLength(1);
    expect(finalState[0]).toMatchObject({ id: "report.docx#0", sourceVersion: "v2" });
  });

  test("a source with no achievement candidates discovers nothing and errors on nothing", async () => {
    const { scanner } = scannerWithFixtures({
      documentItems: [
        { sourceId: "empty.docx", sourceVersion: "v1", sourceType: "document", text: "관련 없는 내용" },
      ],
      wikiItems: [],
    });

    const discovered = await scanner.scan();

    expect(discovered).toEqual([]);
  });
});
