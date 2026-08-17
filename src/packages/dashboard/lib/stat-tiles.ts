import type { KpiCategory, KpiState } from "../../kpi-engine/index.js";
import { KPI_CATEGORY_ORDER } from "./types.js";
import type { StatTile } from "./types.js";

// Deliberately its own copy, not report-renderer's palette.ts labels: these are the stat tile
// captions from docs/design/kpi-dashboard-mockup.html verbatim ("지원 건수" generalized to "활동
// 건수", "프로젝트 완성도", "퀴즈 평균"), while palette.ts's labels are the longer category names
// used as report/email badges ("프로젝트 완성 현황", "퀴즈 점수 향상") — same category, different copy
// for a different surface.
const CATEGORY_LABEL: Record<KpiCategory, string> = {
  "competency-fill": "역량 채우기",
  "activity-count": "활동 건수",
  "project-completion": "프로젝트 완성도",
  "quiz-score": "퀴즈 평균",
};

const NO_DATA = "데이터 없음";

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function valueTextFor(category: KpiCategory, kpis: KpiState[]): string {
  if (kpis.length === 0) return NO_DATA;

  switch (category) {
    case "competency-fill":
    case "project-completion": {
      // Both are naturally percentage-scale: competency-fill via its own achievementRate,
      // project-completion via currentValue already being a recorded percentage.
      const values = category === "competency-fill"
        ? kpis.map((k) => k.achievementRate * 100)
        : kpis.map((k) => k.currentValue);
      return `${Math.round(average(values))}%`;
    }
    case "activity-count":
      return `${kpis.reduce((sum, k) => sum + k.currentValue, 0)}건`;
    case "quiz-score":
      return `${average(kpis.map((k) => k.currentValue)).toFixed(1)}/5`;
  }
}

/** One stat tile per KPI category, always in the same order, even when a category has no KPIs yet. */
export function buildStatTiles(kpis: KpiState[]): StatTile[] {
  return KPI_CATEGORY_ORDER.map((category) => {
    const categoryKpis = kpis.filter((k) => k.definition.category === category);
    return {
      category,
      label: CATEGORY_LABEL[category],
      valueText: valueTextFor(category, categoryKpis),
    };
  });
}
