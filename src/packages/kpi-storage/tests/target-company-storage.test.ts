import { describe, expect, test } from "vitest";
import type { TargetCompany } from "../../kpi-engine/index.js";
import { createTargetCompanyStorage } from "../index.js";
import { createInMemoryDriveClient } from "./fakes/in-memory-drive-client.js";

function targetCompany(overrides: Partial<TargetCompany> = {}): TargetCompany {
  return {
    id: "samsung",
    name: "삼성전자",
    requiredCompetencies: ["반도체 공정 이해", "SPC"],
    deadline: "2026-09-30",
    gap: ["SPC"],
    kpiId: "samsung-competency-fill",
    ...overrides,
  };
}

describe("TargetCompanyStorage", () => {
  test("a saved target company can be listed back", async () => {
    const storage = createTargetCompanyStorage(createInMemoryDriveClient());
    const record = targetCompany();

    await storage.save(record);
    const loaded = await storage.list();

    expect(loaded).toEqual([record]);
  });

  test("listing before anything is saved returns an empty array", async () => {
    const storage = createTargetCompanyStorage(createInMemoryDriveClient());

    expect(await storage.list()).toEqual([]);
  });

  test("saving the same id twice overwrites rather than duplicating it", async () => {
    const storage = createTargetCompanyStorage(createInMemoryDriveClient());
    const original = targetCompany({ deadline: "2026-09-30" });

    await storage.save(original);
    const updated = targetCompany({ deadline: "2026-10-15" });
    await storage.save(updated);

    const loaded = await storage.list();
    expect(loaded).toEqual([updated]);
  });

  test("accumulates multiple distinct target companies across saves", async () => {
    const storage = createTargetCompanyStorage(createInMemoryDriveClient());

    await storage.save(targetCompany({ id: "samsung" }));
    await storage.save(targetCompany({ id: "skhynix", name: "SK하이닉스" }));

    const loaded = await storage.list();
    expect(loaded.map((c) => c.id)).toEqual(["samsung", "skhynix"]);
  });
});
