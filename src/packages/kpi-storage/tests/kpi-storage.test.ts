import { describe, expect, test } from "vitest";
import { createKpi, recordProgress } from "../../kpi-engine/index.js";
import { createKpiStorage } from "../index.js";
import { createInMemoryDriveClient } from "./fakes/in-memory-drive-client.js";

describe("KpiStorage", () => {
  test("a saved KPI can be loaded back with identical state", async () => {
    const storage = createKpiStorage(createInMemoryDriveClient());
    const kpi = recordProgress(
      createKpi({
        id: "apply-count-2026-08",
        name: "이번 달 지원 건수",
        category: "activity-count",
        target: 10,
      }),
      { category: "activity-count", amount: 3 },
    );

    await storage.save(kpi);
    const loaded = await storage.load(kpi.definition.id);

    expect(loaded).toEqual(kpi);
  });

  test("loading a KPI that was never saved returns null", async () => {
    const storage = createKpiStorage(createInMemoryDriveClient());

    const loaded = await storage.load("never-saved");

    expect(loaded).toBeNull();
  });

  test("saving the same KPI id twice overwrites rather than duplicating it", async () => {
    const storage = createKpiStorage(createInMemoryDriveClient());
    const kpi = createKpi({
      id: "apply-count-2026-08",
      name: "이번 달 지원 건수",
      category: "activity-count",
      target: 10,
    });

    await storage.save(kpi);
    const updated = recordProgress(kpi, { category: "activity-count" });
    await storage.save(updated);
    const loaded = await storage.load(kpi.definition.id);

    expect(loaded).toEqual(updated);
  });

  test("list returns an empty array when nothing has been saved", async () => {
    const storage = createKpiStorage(createInMemoryDriveClient());

    expect(await storage.list()).toEqual([]);
  });

  test("list returns every saved KPI", async () => {
    const storage = createKpiStorage(createInMemoryDriveClient());
    const first = createKpi({
      id: "apply-count-2026-08",
      name: "이번 달 지원 건수",
      category: "activity-count",
      target: 10,
    });
    const second = recordProgress(
      createKpi({
        id: "ax-portfolio-project",
        name: "AX 포트폴리오 프로젝트 완성 현황",
        category: "project-completion",
        target: 100,
      }),
      { category: "project-completion", percentage: 45 },
    );

    await storage.save(first);
    await storage.save(second);
    const listed = await storage.list();

    expect(listed).toHaveLength(2);
    expect(listed).toEqual(expect.arrayContaining([first, second]));
  });

  test("saving the same KPI id twice does not duplicate it in list", async () => {
    const storage = createKpiStorage(createInMemoryDriveClient());
    const kpi = createKpi({
      id: "apply-count-2026-08",
      name: "이번 달 지원 건수",
      category: "activity-count",
      target: 10,
    });

    await storage.save(kpi);
    await storage.save(recordProgress(kpi, { category: "activity-count" }));
    const listed = await storage.list();

    expect(listed).toHaveLength(1);
  });
});
