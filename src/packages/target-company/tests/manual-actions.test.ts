import { describe, expect, test } from "vitest";
import type { TargetCompany } from "../../kpi-engine/index.js";
import { adjustCompetencyScore, markApplicationComplete } from "../index.js";
import { createFakeKpiStorage } from "./fakes/fake-kpi-storage.js";
import { createFakeTargetCompanyStorage } from "./fakes/fake-target-company-storage.js";

function samsungCompany(overrides: Partial<TargetCompany> = {}): TargetCompany {
  return {
    id: "samsung",
    name: "삼성전자",
    requiredCompetencies: ["a", "b"],
    deadline: "2026-09-30",
    gap: [],
    kpiId: "samsung-competency-fill",
    applicationPeriod: null,
    appliedAt: null,
    ...overrides,
  };
}

describe("markApplicationComplete", () => {
  test("sets appliedAt and persists the updated target company", async () => {
    const targetCompanyStorage = createFakeTargetCompanyStorage();
    await targetCompanyStorage.save(samsungCompany());
    const kpiStorage = createFakeKpiStorage();

    const updated = await markApplicationComplete({ targetCompanyStorage, kpiStorage }, "samsung", "2026-08-17T09:00:00.000Z");

    expect(updated.appliedAt).toBe("2026-08-17T09:00:00.000Z");
    expect(await targetCompanyStorage.list()).toEqual([updated]);
  });

  test("creates the current month's 이번 달 지원 건수 KPI if it doesn't exist yet", async () => {
    const targetCompanyStorage = createFakeTargetCompanyStorage();
    await targetCompanyStorage.save(samsungCompany());
    const kpiStorage = createFakeKpiStorage();

    await markApplicationComplete({ targetCompanyStorage, kpiStorage }, "samsung", "2026-08-17T09:00:00.000Z");

    const kpi = await kpiStorage.load("apply-count-2026-08");
    expect(kpi?.definition).toEqual({
      id: "apply-count-2026-08",
      name: "이번 달 지원 건수",
      category: "activity-count",
      target: 5,
    });
    expect(kpi?.currentValue).toBe(1);
  });

  test("increments the existing month's KPI rather than replacing it", async () => {
    const targetCompanyStorage = createFakeTargetCompanyStorage();
    await targetCompanyStorage.save(samsungCompany({ id: "samsung" }));
    await targetCompanyStorage.save(samsungCompany({ id: "skhynix", name: "SK하이닉스", kpiId: "skhynix-competency-fill" }));
    const kpiStorage = createFakeKpiStorage();

    await markApplicationComplete({ targetCompanyStorage, kpiStorage }, "samsung", "2026-08-17T09:00:00.000Z");
    await markApplicationComplete({ targetCompanyStorage, kpiStorage }, "skhynix", "2026-08-20T09:00:00.000Z");

    const kpi = await kpiStorage.load("apply-count-2026-08");
    expect(kpi?.currentValue).toBe(2);
  });

  test("is idempotent — checking an already-applied company again doesn't double-count it", async () => {
    const targetCompanyStorage = createFakeTargetCompanyStorage();
    await targetCompanyStorage.save(samsungCompany({ appliedAt: "2026-08-10T00:00:00.000Z" }));
    const kpiStorage = createFakeKpiStorage();

    const result = await markApplicationComplete({ targetCompanyStorage, kpiStorage }, "samsung", "2026-08-17T09:00:00.000Z");

    expect(result.appliedAt).toBe("2026-08-10T00:00:00.000Z");
    expect(await kpiStorage.load("apply-count-2026-08")).toBeNull();
  });

  test("throws for a company id that was never registered", async () => {
    const targetCompanyStorage = createFakeTargetCompanyStorage();
    const kpiStorage = createFakeKpiStorage();

    await expect(
      markApplicationComplete({ targetCompanyStorage, kpiStorage }, "nonexistent", "2026-08-17T09:00:00.000Z"),
    ).rejects.toThrow(/nonexistent/);
  });
});

describe("adjustCompetencyScore", () => {
  test("applies a positive adjustment as an additional progress event", async () => {
    const kpiStorage = createFakeKpiStorage();
    await kpiStorage.save({
      definition: { id: "samsung-competency-fill", name: "삼성전자 역량 채우기", category: "competency-fill", target: 4 },
      history: [2],
      currentValue: 2,
      achievementRate: 0.5,
    });

    const updated = await adjustCompetencyScore({ kpiStorage }, "samsung-competency-fill", 1);

    expect(updated.currentValue).toBe(3);
    expect(updated.achievementRate).toBe(0.75);
    expect((await kpiStorage.load("samsung-competency-fill"))?.currentValue).toBe(3);
  });

  test("applies a negative adjustment", async () => {
    const kpiStorage = createFakeKpiStorage();
    await kpiStorage.save({
      definition: { id: "samsung-competency-fill", name: "삼성전자 역량 채우기", category: "competency-fill", target: 4 },
      history: [2],
      currentValue: 2,
      achievementRate: 0.5,
    });

    const updated = await adjustCompetencyScore({ kpiStorage }, "samsung-competency-fill", -1);

    expect(updated.currentValue).toBe(1);
  });

  test("throws for a KPI id that doesn't exist", async () => {
    const kpiStorage = createFakeKpiStorage();

    await expect(adjustCompetencyScore({ kpiStorage }, "nonexistent", 1)).rejects.toThrow(/nonexistent/);
  });
});
