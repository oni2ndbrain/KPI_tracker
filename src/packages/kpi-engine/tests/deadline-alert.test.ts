import { describe, expect, test } from "vitest";
import { createKpi, recordProgress } from "../index.js";
import { buildDeadlineAlertData, shouldSendDeadlineAlert } from "../index.js";
import type { KpiState } from "../index.js";

function kpiAt(target: number, amount: number): KpiState {
  return recordProgress(
    createKpi({ id: "samsung-competency-fill", name: "삼성전자 역량 채우기", category: "competency-fill", target }),
    { category: "competency-fill", amount },
  );
}

describe("shouldSendDeadlineAlert", () => {
  test.each([14, 7, 1])("true at exactly D-%i when behind target", (days) => {
    const kpi = kpiAt(10, 5); // 50%

    const result = shouldSendDeadlineAlert({
      targetCompanyName: "삼성전자",
      deadline: `2026-09-${String(1 + days).padStart(2, "0")}`,
      kpi,
      gap: [],
      today: "2026-09-01",
    });

    expect(result).toBe(true);
  });

  test("false on a day that isn't a D-14/D-7/D-1 checkpoint", () => {
    const kpi = kpiAt(10, 5); // 50%

    const result = shouldSendDeadlineAlert({
      targetCompanyName: "삼성전자",
      deadline: "2026-09-11", // D-10
      kpi,
      gap: [],
      today: "2026-09-01",
    });

    expect(result).toBe(false);
  });

  test("false when the KPI is already at or above target, even on a checkpoint day", () => {
    const kpi = kpiAt(10, 10); // 100%

    const result = shouldSendDeadlineAlert({
      targetCompanyName: "삼성전자",
      deadline: "2026-09-08", // D-7
      kpi,
      gap: [],
      today: "2026-09-01",
    });

    expect(result).toBe(false);
  });

  test("false once the deadline has already passed", () => {
    const kpi = kpiAt(10, 5); // 50%

    const result = shouldSendDeadlineAlert({
      targetCompanyName: "삼성전자",
      deadline: "2026-08-25",
      kpi,
      gap: [],
      today: "2026-09-01",
    });

    expect(result).toBe(false);
  });
});

describe("buildDeadlineAlertData", () => {
  test("carries through the target company, KPI, and deadline", () => {
    const kpi = kpiAt(10, 3);

    const data = buildDeadlineAlertData({
      targetCompanyName: "삼성전자",
      deadline: "2026-09-08",
      kpi,
      gap: [],
      today: "2026-09-01",
      generatedAt: "2026-09-01T00:00:00.000Z",
    });

    expect(data.targetCompanyName).toBe("삼성전자");
    expect(data.kpiName).toBe("삼성전자 역량 채우기");
    expect(data.deadline).toBe("2026-09-08");
    expect(data.daysUntilDeadline).toBe(7);
    expect(data.achievementRate).toBe(0.3);
    expect(data.generatedAt).toBe("2026-09-01T00:00:00.000Z");
  });

  test("without a gap list, the action message falls back to the KPI's remaining count", () => {
    const kpi = kpiAt(10, 3);

    const data = buildDeadlineAlertData({
      targetCompanyName: "삼성전자",
      deadline: "2026-09-08",
      kpi,
      gap: [],
      today: "2026-09-01",
    });

    expect(data.actionMessage).toContain("D-7");
    expect(data.actionMessage).toContain("삼성전자 역량 채우기");
    expect(data.actionMessage).toContain("7"); // 10 - 3 remaining
  });

  test("with a gap list, the action message names the specific missing competencies", () => {
    const kpi = kpiAt(10, 3);

    const data = buildDeadlineAlertData({
      targetCompanyName: "삼성전자",
      deadline: "2026-09-08",
      kpi,
      gap: ["통계적 공정관리(SPC)", "품질관리(6시그마)"],
      today: "2026-09-01",
    });

    expect(data.actionMessage).toContain("D-7");
    expect(data.actionMessage).toContain("통계적 공정관리(SPC)");
    expect(data.actionMessage).toContain("외 1개");
  });

  test("with a single-item gap list, there's no '외 N개' suffix", () => {
    const kpi = kpiAt(10, 9);

    const data = buildDeadlineAlertData({
      targetCompanyName: "삼성전자",
      deadline: "2026-09-08",
      kpi,
      gap: ["품질관리(6시그마)"],
      today: "2026-09-01",
    });

    expect(data.actionMessage).toContain("품질관리(6시그마)");
    expect(data.actionMessage).not.toContain("외");
  });
});
