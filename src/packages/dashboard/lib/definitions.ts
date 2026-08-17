import type { KpiCategory } from "../../kpi-engine/index.js";
import type { IndicatorDefinition } from "./types.js";

// One 지표 정의서 per KPI category (not per KPI instance) — matches the agreed mockup, which
// titles the doc by category ("지표 정의서 · 역량 채우기") rather than by a specific target
// company's KPI. Each formula/data-source description is derived from categories.ts's own
// currentValueFor logic, not invented independently of the code that actually computes it.
const DEFINITIONS: Record<KpiCategory, IndicatorDefinition> = {
  "competency-fill": {
    category: "competency-fill",
    categoryLabel: "역량 채우기",
    formula: "(충족한 JD 요구 역량 수 ÷ 전체 요구 역량 수) × 100, 진단 퀴즈 점수로 가중 보정",
    dataSource: "채용공고 텍스트, LLM Wiki 노트/대화, 역량 진단 퀴즈",
    aggregationCadence: "매주",
    relatedKpis: "목표 회사 등록마다 하나씩 생성되며, 퀴즈 점수 향상 KPI로 보정돼요.",
  },
  "project-completion": {
    category: "project-completion",
    categoryLabel: "프로젝트 완성 현황",
    formula: "가장 최근에 기록한 진행률(%)을 그대로 현재값으로 사용",
    dataSource: "사용자가 직접 기록한 진행률",
    aggregationCadence: "기록할 때마다",
    relatedKpis: "다른 KPI 카테고리와 독립적으로 추적돼요.",
  },
  "activity-count": {
    category: "activity-count",
    categoryLabel: "활동 건수",
    formula: "기간 내 기록된 활동 이벤트 수의 누적 합",
    dataSource: "지원 완료 체크 등 사용자가 기록한 활동 이벤트",
    aggregationCadence: "매월",
    relatedKpis: "다른 KPI 카테고리와 독립적으로 추적돼요.",
  },
  "quiz-score": {
    category: "quiz-score",
    categoryLabel: "퀴즈 점수 향상",
    formula: "역량 진단 퀴즈 답변 점수(1~5)의 평균",
    dataSource: "역량 진단 퀴즈 채점 결과",
    aggregationCadence: "퀴즈를 완료할 때마다",
    relatedKpis: "역량 채우기 KPI의 점수를 보정하는 데 쓰여요.",
  },
};

export function allDefinitions(): Record<KpiCategory, IndicatorDefinition> {
  return DEFINITIONS;
}
