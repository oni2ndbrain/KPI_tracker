import { describe, expect, test } from "vitest";
import type { Achievement } from "../../kpi-engine/index.js";
import { createAchievementStorage } from "../index.js";
import { createInMemoryDriveClient } from "./fakes/in-memory-drive-client.js";

function achievement(overrides: Partial<Achievement> = {}): Achievement {
  return {
    id: "doc-1#0",
    sourceId: "docs/report.docx",
    sourceVersion: "2026-08-01T00:00:00.000Z",
    sourceType: "document",
    title: "수율 개선 프로젝트 리드",
    description: "공정 데이터 분석으로 수율 2% 개선",
    discoveredAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("AchievementStorage", () => {
  test("a saved achievement can be listed back", async () => {
    const storage = createAchievementStorage(createInMemoryDriveClient());
    const record = achievement();

    await storage.save(record);
    const loaded = await storage.list();

    expect(loaded).toEqual([record]);
  });

  test("listing before anything is saved returns an empty array", async () => {
    const storage = createAchievementStorage(createInMemoryDriveClient());

    expect(await storage.list()).toEqual([]);
  });

  test("saving the same achievement id twice overwrites rather than duplicating it", async () => {
    const storage = createAchievementStorage(createInMemoryDriveClient());
    const original = achievement({ title: "초안 제목" });

    await storage.save(original);
    const updated = achievement({ title: "수정된 제목" });
    await storage.save(updated);

    const loaded = await storage.list();
    expect(loaded).toEqual([updated]);
  });

  test("accumulates multiple distinct achievements across saves", async () => {
    const storage = createAchievementStorage(createInMemoryDriveClient());

    await storage.save(achievement({ id: "doc-1#0" }));
    await storage.save(achievement({ id: "doc-1#1", title: "다른 성과" }));

    const loaded = await storage.list();
    expect(loaded.map((a) => a.id)).toEqual(["doc-1#0", "doc-1#1"]);
  });

  test("deleteBySourceId removes every achievement from that source, leaving others untouched", async () => {
    const storage = createAchievementStorage(createInMemoryDriveClient());
    await storage.save(achievement({ id: "doc-1#0", sourceId: "doc-1" }));
    await storage.save(achievement({ id: "doc-1#1", sourceId: "doc-1", title: "다른 성과" }));
    await storage.save(achievement({ id: "doc-2#0", sourceId: "doc-2" }));

    await storage.deleteBySourceId("doc-1");

    const loaded = await storage.list();
    expect(loaded.map((a) => a.id)).toEqual(["doc-2#0"]);
  });

  test("deleteBySourceId is a no-op when nothing has ever been saved", async () => {
    const storage = createAchievementStorage(createInMemoryDriveClient());

    await expect(storage.deleteBySourceId("never-saved")).resolves.toBeUndefined();
  });
});
