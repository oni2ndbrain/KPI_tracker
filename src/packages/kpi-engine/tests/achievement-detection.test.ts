import { describe, expect, test } from "vitest";
import { createKpi, justReachedTarget, recordProgress } from "../index.js";

describe("justReachedTarget", () => {
  test("true the moment progress crosses from below target to at target", () => {
    const kpi = createKpi({ id: "apply-count", name: "지원 건수", category: "activity-count", target: 5 });
    const previous = recordProgress(kpi, { category: "activity-count", amount: 4 });
    const updated = recordProgress(previous, { category: "activity-count", amount: 1 });

    expect(justReachedTarget(previous, updated)).toBe(true);
  });

  test("true when progress overshoots past target in one step", () => {
    const kpi = createKpi({ id: "apply-count", name: "지원 건수", category: "activity-count", target: 5 });
    const previous = recordProgress(kpi, { category: "activity-count", amount: 2 });
    const updated = recordProgress(previous, { category: "activity-count", amount: 10 });

    expect(justReachedTarget(previous, updated)).toBe(true);
  });

  test("false while still below target", () => {
    const kpi = createKpi({ id: "apply-count", name: "지원 건수", category: "activity-count", target: 5 });
    const previous = recordProgress(kpi, { category: "activity-count", amount: 1 });
    const updated = recordProgress(previous, { category: "activity-count", amount: 1 });

    expect(justReachedTarget(previous, updated)).toBe(false);
  });

  test("false when already at target before this update (no re-fire on later events)", () => {
    const kpi = createKpi({ id: "apply-count", name: "지원 건수", category: "activity-count", target: 5 });
    const previous = recordProgress(kpi, { category: "activity-count", amount: 5 });
    const updated = recordProgress(previous, { category: "activity-count", amount: 1 });

    expect(justReachedTarget(previous, updated)).toBe(false);
  });

  test("false for a project-completion KPI that regresses back down after being at target", () => {
    const kpi = createKpi({ id: "ax-portfolio", name: "AX 포트폴리오", category: "project-completion", target: 100 });
    const previous = recordProgress(kpi, { category: "project-completion", percentage: 100 });
    const updated = recordProgress(previous, { category: "project-completion", percentage: 80 });

    expect(justReachedTarget(previous, updated)).toBe(false);
  });
});
