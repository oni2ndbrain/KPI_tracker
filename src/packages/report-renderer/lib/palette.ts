import type { KpiCategory } from "../../kpi-engine/index.js";

// The colorful table-report palette agreed for regular/achievement report emails — see
// docs/design/kpi-dashboard-mockup.html (mint/coral/amber/purple), reused as-is here so the
// email and the dashboard read as one visual system.
export interface CategoryPalette {
  label: string;
  bg: string;
  text: string;
  value: string;
  bar: string;
}

const PALETTE: Record<KpiCategory, CategoryPalette> = {
  "competency-fill": { label: "역량 채우기", bg: "#9FE1CB", text: "#0F6E56", value: "#085041", bar: "#5DCAA5" },
  "activity-count": { label: "활동 건수", bg: "#F5C4B3", text: "#993C1D", value: "#712B13", bar: "#F0997B" },
  "project-completion": { label: "프로젝트 완성 현황", bg: "#FAC775", text: "#854F0B", value: "#633806", bar: "#FAC775" },
  "quiz-score": { label: "퀴즈 점수 향상", bg: "#CECBF6", text: "#534AB7", value: "#3C3489", bar: "#AFA9EC" },
};

export function paletteFor(category: KpiCategory): CategoryPalette {
  return PALETTE[category];
}

export const WEAK_RED = { bg: "#FBEAEA", text: "#A32D2D", bar: "#F09595" };
