import { describe, expect, test } from "vitest";
import { createKpi, recordProgress } from "../index.js";

describe("createKpi", () => {
  test("a freshly created KPI starts at zero progress", () => {
    const kpi = createKpi({
      id: "apply-count-2026-08",
      name: "이번 달 지원 건수",
      category: "activity-count",
      target: 10,
    });

    expect(kpi.currentValue).toBe(0);
    expect(kpi.achievementRate).toBe(0);
  });
});

describe("recordProgress: activity-count", () => {
  test("each event increments the count and recomputes achievement rate against target", () => {
    const kpi = createKpi({
      id: "apply-count-2026-08",
      name: "이번 달 지원 건수",
      category: "activity-count",
      target: 10,
    });

    const afterOne = recordProgress(kpi, { category: "activity-count" });
    const afterTwo = recordProgress(afterOne, { category: "activity-count" });

    expect(afterTwo.currentValue).toBe(2);
    expect(afterTwo.achievementRate).toBe(0.2);
  });
});

describe("recordProgress: project-completion", () => {
  test("each event sets the completion percentage directly, overwriting the previous one", () => {
    const kpi = createKpi({
      id: "ax-portfolio-project",
      name: "AX 포트폴리오 프로젝트 완성 현황",
      category: "project-completion",
      target: 100,
    });

    const afterFirst = recordProgress(kpi, { category: "project-completion", percentage: 30 });
    const afterSecond = recordProgress(afterFirst, { category: "project-completion", percentage: 45 });

    expect(afterSecond.currentValue).toBe(45);
    expect(afterSecond.achievementRate).toBe(0.45);
  });
});

describe("recordProgress: competency-fill", () => {
  test("each event accumulates covered competencies against the target count", () => {
    const kpi = createKpi({
      id: "samsung-process-engineer-competency",
      name: "삼성전자 공정기술 역량 채우기",
      category: "competency-fill",
      target: 8,
    });

    const afterOne = recordProgress(kpi, { category: "competency-fill" });
    const afterTwo = recordProgress(afterOne, { category: "competency-fill", amount: 3 });

    expect(afterTwo.currentValue).toBe(4);
    expect(afterTwo.achievementRate).toBe(0.5);
  });
});

describe("recordProgress: quiz-score", () => {
  test("current value tracks the running average of quiz scores, not just the latest one", () => {
    const kpi = createKpi({
      id: "competency-quiz-average",
      name: "역량 진단 퀴즈 평균 점수",
      category: "quiz-score",
      target: 5,
    });

    const afterFirst = recordProgress(kpi, { category: "quiz-score", score: 3 });
    const afterSecond = recordProgress(afterFirst, { category: "quiz-score", score: 5 });

    expect(afterSecond.currentValue).toBe(4);
    expect(afterSecond.achievementRate).toBe(0.8);
  });
});

describe("recordProgress: category mismatch", () => {
  test("rejects an event whose category does not match the KPI's own category", () => {
    const kpi = createKpi({
      id: "apply-count-2026-08",
      name: "이번 달 지원 건수",
      category: "activity-count",
      target: 10,
    });

    expect(() => recordProgress(kpi, { category: "quiz-score", score: 5 })).toThrow();
  });
});
