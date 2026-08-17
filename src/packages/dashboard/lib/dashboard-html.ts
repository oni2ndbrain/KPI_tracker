import { escapeHtml, paletteFor } from "../../report-renderer/index.js";
import type { KpiCategory } from "../../kpi-engine/index.js";
import { KPI_CATEGORY_ORDER } from "./types.js";
import type {
  CompetencyGapPoint,
  DashboardViewModel,
  DeadlineUrgency,
  IndicatorDefinition,
  KpiStatus,
  KpiStatusRow,
  QuizCompetencyScore,
  StatTile,
  TargetCompanyRow,
} from "./types.js";

// Chrome, palette, and layout are copied from docs/design/kpi-dashboard-mockup.html as-is — this
// ticket implements the *read* side against real data, not a new design (see spec's Implementation
// Decisions section on the 관리 화면 adapter).

const STATUS_COLOR_VAR: Record<KpiStatus, string> = {
  achieved: "var(--text-success)",
  warning: "var(--text-warning)",
  danger: "var(--text-danger)",
};

const URGENCY_COLOR_VAR: Record<DeadlineUrgency, string> = {
  danger: "var(--text-danger)",
  warning: "var(--text-warning)",
  neutral: "var(--text-secondary)",
};

function statTileHtml(tile: StatTile): string {
  const palette = paletteFor(tile.category);
  return (
    `<button class="kpi-item" data-category="${tile.category}" style="text-align:left; background: ${palette.bg}; border-radius: 10px; padding: 12px; display:block; width:100%;">` +
    `<p style="font-size:11px; color:${palette.text}; margin:0 0 4px;">${escapeHtml(tile.label)}</p>` +
    `<p style="font-size:20px; font-weight:500; color:${palette.value}; margin:0;">${escapeHtml(tile.valueText)}</p>` +
    `</button>`
  );
}

function gapBarHtml(point: CompetencyGapPoint): string {
  return (
    `<div style="margin-bottom:10px;">` +
    `<div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;"><span>${escapeHtml(point.competency)}</span><span style="color:var(--text-secondary);">${point.heldScore} / ${point.requiredScore}</span></div>` +
    `<div style="background:var(--surface-1); border-radius:6px; height:8px; overflow:hidden;">` +
    `<div style="width:${point.heldScore}%; height:100%; background:#5DCAA5;"></div>` +
    `</div>` +
    `</div>`
  );
}

function dashboardPanelHtml(model: DashboardViewModel): string {
  const tiles = `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin-bottom: 14px;">` +
    model.statTiles.map(statTileHtml).join("") +
    `</div>`;

  const gapSection = model.competencyGap.length === 0
    ? `<p style="font-size:13px; color:var(--text-secondary); margin:0;">등록된 목표 회사가 없어서 역량 갭을 보여드릴 게 없어요.</p>`
    : model.competencyGap.map(gapBarHtml).join("");

  return (
    tiles +
    `<div style="background: var(--surface-0); border: 0.5px solid var(--border); border-radius: 10px; padding: 1rem;">` +
    `<p style="font-size: 12px; color: var(--text-secondary); margin: 0 0 10px;">역량 갭 (JD 요구 vs 보유)</p>` +
    gapSection +
    `</div>`
  );
}

function statusRowHtml(row: KpiStatusRow): string {
  return (
    `<button class="kpi-item" data-category="${row.category}" style="display:flex; width:100%; justify-content:space-between; align-items:center; padding:11px 14px; border-bottom:0.5px solid var(--border); text-align:left;">` +
    `<span style="font-size:13px;">${escapeHtml(row.kpiName)}</span>` +
    `<span style="font-size:13px; font-weight:500; color:${STATUS_COLOR_VAR[row.status]};">${escapeHtml(row.statusText)}</span>` +
    `</button>`
  );
}

function kpiTablePanelHtml(model: DashboardViewModel): string {
  const rows = model.kpiRows.length === 0
    ? `<p style="font-size:13px; color:var(--text-secondary); margin:0; padding:14px;">아직 등록된 KPI가 없어요.</p>`
    : model.kpiRows.map(statusRowHtml).join("");

  return (
    `<p style="font-size: 13px; font-weight: 500; margin: 0 0 12px;">KPI 항목별 현황</p>` +
    `<div style="background: var(--surface-0); border: 0.5px solid var(--border); border-radius: 10px; overflow: hidden;">${rows}</div>`
  );
}

function appliedControlHtml(row: TargetCompanyRow): string {
  if (row.appliedAt) {
    return `<span style="font-size:11px; color:var(--text-success); font-weight:500;">✓ 지원 완료</span>`;
  }
  return (
    `<form method="post" action="/actions/mark-applied" style="margin:0;">` +
    `<input type="hidden" name="companyId" value="${escapeHtml(row.id)}">` +
    `<button type="submit" style="font-size:11px; color:var(--text-accent); text-decoration:underline;">지원 완료 체크</button>` +
    `</form>`
  );
}

function adjustCompetencyScoreFormHtml(row: TargetCompanyRow): string {
  return (
    `<form method="post" action="/actions/adjust-competency-score" style="display:flex; gap:6px; align-items:center; margin:0;">` +
    `<input type="hidden" name="kpiId" value="${escapeHtml(row.kpiId)}">` +
    `<label style="font-size:11px; color:var(--text-muted);">역량 점수 조정</label>` +
    `<input type="number" name="amount" value="1" step="1" style="width:48px; font-size:12px; padding:2px 4px; border:0.5px solid var(--border); border-radius:4px;">` +
    `<button type="submit" style="font-size:11px; color:var(--text-accent); text-decoration:underline;">적용</button>` +
    `</form>`
  );
}

function targetCompanyRowHtml(row: TargetCompanyRow): string {
  const gapText = row.gap.length === 0 ? "부족 역량 없음" : `부족 역량: ${row.gap.join(", ")}`;
  return (
    `<div>` +
    `<div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:6px;"><span>${escapeHtml(row.name)}</span><span style="color:${URGENCY_COLOR_VAR[row.urgency]}; font-weight:500;">D-${row.daysUntilDeadline}</span></div>` +
    `<div style="background:var(--surface-1); border-radius:6px; height:8px; overflow:hidden;"><div style="width:${Math.round(row.progressRate * 100)}%; height:100%; background:#5DCAA5;"></div></div>` +
    `<p style="font-size:11px; color:var(--text-muted); margin:6px 0 0;">${escapeHtml(gapText)}</p>` +
    `<div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; gap:8px; flex-wrap:wrap;">` +
    appliedControlHtml(row) +
    adjustCompetencyScoreFormHtml(row) +
    `</div>` +
    `</div>`
  );
}

function registerTargetCompanyFormHtml(): string {
  return (
    `<div style="background: var(--surface-0); border: 0.5px solid var(--border); border-radius: 10px; padding: 14px; margin-top: 14px;">` +
    `<p style="font-size: 13px; font-weight: 500; margin: 0 0 10px;">새 목표 회사 등록</p>` +
    `<form method="post" action="/actions/register-target-company" style="display:flex; flex-direction:column; gap:8px;">` +
    `<input type="text" name="name" placeholder="회사명 (예: 삼성전자 · 공정기술)" required style="font-size:13px; padding:8px; border:0.5px solid var(--border); border-radius:6px; font-family:inherit;">` +
    `<textarea name="jdText" placeholder="채용공고 원문을 붙여넣어 주세요. 예)\n자격요건: 반도체 공정 이해, 통계적 공정관리(SPC)\n지원마감: 2026-09-30" required rows="5" style="font-size:13px; padding:8px; border:0.5px solid var(--border); border-radius:6px; font-family:inherit; resize:vertical;"></textarea>` +
    `<button type="submit" style="align-self:flex-start; font-size:13px; font-weight:500; color:var(--text-accent); background:var(--bg-accent); padding:7px 14px; border-radius:6px;">등록</button>` +
    `</form>` +
    `</div>`
  );
}

function targetCompanyPanelHtml(model: DashboardViewModel): string {
  const body = model.targetCompanies.length === 0
    ? `<p style="font-size:13px; color:var(--text-secondary); margin:0;">등록된 목표 회사가 없어요.</p>`
    : model.targetCompanies.map(targetCompanyRowHtml).join("");

  return (
    `<p style="font-size: 13px; font-weight: 500; margin: 0 0 12px;">목표 회사 마감일 현황</p>` +
    `<div style="background: var(--surface-0); border: 0.5px solid var(--border); border-radius: 10px; padding: 14px; display:flex; flex-direction:column; gap:16px;">${body}</div>` +
    registerTargetCompanyFormHtml()
  );
}

function definitionRowHtml(label: string, value: string): string {
  return (
    `<div style="display:flex; padding:11px 14px; border-bottom:0.5px solid var(--border);">` +
    `<span style="width:100px; font-size:12px; color:var(--text-muted); flex-shrink:0;">${escapeHtml(label)}</span>` +
    `<span style="font-size:13px;">${escapeHtml(value)}</span>` +
    `</div>`
  );
}

function definitionBlockHtml(definition: IndicatorDefinition, category: KpiCategory): string {
  const display = category === "competency-fill" ? "block" : "none";
  return (
    `<div id="def-${category}" class="defblock" style="display:${display};">` +
    `<p style="font-size: 13px; font-weight: 500; margin: 0 0 12px;">지표 정의서 · ${escapeHtml(definition.categoryLabel)}</p>` +
    `<div style="background: var(--surface-0); border: 0.5px solid var(--border); border-radius: 10px; overflow: hidden;">` +
    definitionRowHtml("지표 구분", `${definition.categoryLabel} KPI`) +
    definitionRowHtml("산식", definition.formula) +
    definitionRowHtml("데이터 원천", definition.dataSource) +
    definitionRowHtml("집계 주기", definition.aggregationCadence) +
    definitionRowHtml("관련 KPI", definition.relatedKpis) +
    `</div>` +
    `</div>`
  );
}

function definitionPanelHtml(model: DashboardViewModel): string {
  return KPI_CATEGORY_ORDER.map((category) => definitionBlockHtml(model.definitions[category], category)).join("");
}

function quizScoreBarHtml(score: QuizCompetencyScore): string {
  const widthPct = Math.round((score.score / 5) * 100);
  const barColor = score.score < 3 ? "#F09595" : "#5DCAA5";
  return (
    `<div style="margin-bottom:10px;">` +
    `<div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;"><span>${escapeHtml(score.competency)}</span><span style="color:var(--text-secondary);">${score.score.toFixed(1)}/5</span></div>` +
    `<div style="background:var(--surface-1); border-radius:6px; height:8px; overflow:hidden;">` +
    `<div style="width:${widthPct}%; height:100%; background:${barColor};"></div>` +
    `</div>` +
    `</div>`
  );
}

function quizInactivityBannerHtml(daysSinceLastQuiz: number | null): string {
  const message = daysSinceLastQuiz === null
    ? "아직 역량 진단 퀴즈를 진행한 적이 없어요 · 이번 주 진단해볼까요?"
    : `마지막 진단 ${daysSinceLastQuiz}일 전 · 이번 주 진단해볼까요?`;
  return (
    `<div style="background: var(--bg-warning); border-radius: 8px; padding: 9px 12px; display:flex; align-items:center; gap:8px; margin-bottom:14px;">` +
    `<span style="font-size:12px; color:var(--text-warning);">${escapeHtml(message)}</span>` +
    `</div>`
  );
}

function startQuizFormHtml(model: DashboardViewModel): string {
  if (model.targetCompanies.length === 0) {
    return (
      `<div style="background: var(--surface-0); border: 0.5px solid var(--border); border-radius: 10px; padding: 14px; margin-top: 14px;">` +
      `<p style="font-size: 13px; font-weight: 500; margin: 0 0 6px;">역량 진단 퀴즈 시작</p>` +
      `<p style="font-size:12px; color:var(--text-secondary); margin:0;">퀴즈를 시작하려면 먼저 목표 회사를 등록해주세요.</p>` +
      `</div>`
    );
  }

  const options = model.targetCompanies
    .map((company) => `<option value="${escapeHtml(company.id)}">${escapeHtml(company.name)}</option>`)
    .join("");

  return (
    `<div style="background: var(--surface-0); border: 0.5px solid var(--border); border-radius: 10px; padding: 14px; margin-top: 14px;">` +
    `<p style="font-size: 13px; font-weight: 500; margin: 0 0 10px;">역량 진단 퀴즈 시작</p>` +
    `<form method="post" action="/actions/start-quiz" style="display:flex; gap:8px; align-items:center;">` +
    `<select name="companyId" style="font-size:13px; padding:6px; border:0.5px solid var(--border); border-radius:6px; font-family:inherit;">${options}</select>` +
    `<button type="submit" style="font-size:13px; font-weight:500; color:var(--text-accent); background:var(--bg-accent); padding:7px 14px; border-radius:6px;">퀴즈 시작</button>` +
    `</form>` +
    `</div>`
  );
}

function quizPanelHtml(model: DashboardViewModel): string {
  const body = model.quizCompetencyScores.length === 0
    ? `<p style="font-size:13px; color:var(--text-secondary); margin:0; padding:14px;">아직 진단 기록이 없어요.</p>`
    : model.quizCompetencyScores.map(quizScoreBarHtml).join("");

  return (
    quizInactivityBannerHtml(model.daysSinceLastQuiz) +
    `<p style="font-size: 13px; font-weight: 500; margin: 0 0 10px;">항목별 점수 (5점 만점)</p>` +
    `<div style="background: var(--surface-0); border: 0.5px solid var(--border); border-radius: 10px; padding: 1rem;">${body}</div>` +
    startQuizFormHtml(model)
  );
}

const NAV_ITEMS: Array<{ panel: string; label: string }> = [
  { panel: "d-dash", label: "대시보드" },
  { panel: "d-table", label: "KPI 현황" },
  { panel: "d-company", label: "목표 회사" },
  { panel: "d-quiz", label: "역량 진단" },
  { panel: "d-def", label: "지표 정의서" },
];

function navButtonHtml(item: { panel: string; label: string }, index: number): string {
  const active = index === 0;
  const bg = active ? "var(--bg-accent)" : "transparent";
  const color = active ? "var(--text-accent)" : "var(--text-primary)";
  return (
    `<button class="navbtn" data-panel="${item.panel}" style="display:flex; align-items:center; gap:9px; text-align:left; padding:7px 8px; font-size:13px; border-radius:6px; background: ${bg}; color: ${color};">${item.label}</button>`
  );
}

/** Shared palette/chrome, reused by the transient action pages (quiz-taking, grading result) so
 * they look like the same app instead of a bare unstyled form. */
export const PAGE_STYLE = `
  :root {
    --surface-0: #fcfcfb;
    --surface-1: #f1efe8;
    --surface-2: #ffffff;
    --text-primary: #0b0b0b;
    --text-secondary: #52514e;
    --text-muted: #898781;
    --border: rgba(11,11,11,0.10);
    --border-strong: rgba(11,11,11,0.18);
    --bg-accent: #e6f1fb;
    --text-accent: #185fa5;
    --bg-warning: #faeeda;
    --text-warning: #854f0b;
    --text-success: #3b6d11;
    --text-danger: #a32d2d;
    --radius: 8px;
    font-family: -apple-system, "Segoe UI", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif;
  }
  body { background: var(--surface-0); color: var(--text-primary); margin: 0; padding: 2rem; }
  .wrap { max-width: 760px; margin: 0 auto; }
  button { font-family: inherit; border: none; background: transparent; cursor: pointer; }
  .kpi-item { cursor: pointer; }
`;

/** The macOS-style title bar used at the top of every page (dashboard and the transient action
 * pages alike). */
export function macChromeHtml(title: string): string {
  return (
    `<div style="background: var(--surface-1); height: 40px; display: flex; align-items: center; padding: 0 14px; position: relative; border-bottom: 0.5px solid var(--border);">` +
    `<div style="display: flex; gap: 8px;">` +
    `<span style="width: 12px; height: 12px; border-radius: 50%; background: #FF5F57;"></span>` +
    `<span style="width: 12px; height: 12px; border-radius: 50%; background: #FEBC2E;"></span>` +
    `<span style="width: 12px; height: 12px; border-radius: 50%; background: #28C840;"></span>` +
    `</div>` +
    `<span style="position: absolute; left: 50%; transform: translateX(-50%); font-size: 13px; font-weight: 500;">${escapeHtml(title)}</span>` +
    `</div>`
  );
}

export function renderDashboardPage(model: DashboardViewModel): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>KPI_tracker 관리 화면</title>
<style>${PAGE_STYLE}</style>
</head>
<body>
<div class="wrap">
<div style="border: 0.5px solid var(--border); border-radius: 12px; overflow: hidden;">

  ${macChromeHtml("KPI_tracker")}

  <div style="display: grid; grid-template-columns: 168px 1fr; min-height: 580px;">
    <div style="background: var(--surface-1); padding: 14px 10px; display: flex; flex-direction: column; gap: 2px; border-right: 0.5px solid var(--border);">
      <p style="font-size: 11px; font-weight: 500; color: var(--text-muted); padding: 0 8px; margin: 4px 0 6px; letter-spacing: 0.02em;">탐색</p>
      ${NAV_ITEMS.map(navButtonHtml).join("\n      ")}
      <p style="font-size: 11px; color: var(--text-muted); padding: 12px 8px 0; margin: 10px 0 0; border-top: 0.5px solid var(--border); line-height: 1.6;">정기·달성 리포트와 D-day 알림은 이메일로 별도 발송돼요.</p>
    </div>

    <div style="background: var(--surface-2); padding: 1.25rem;">
      <div id="d-dash" class="dpanel">${dashboardPanelHtml(model)}</div>
      <div id="d-table" class="dpanel" style="display:none;">${kpiTablePanelHtml(model)}</div>
      <div id="d-company" class="dpanel" style="display:none;">${targetCompanyPanelHtml(model)}</div>
      <div id="d-quiz" class="dpanel" style="display:none;">${quizPanelHtml(model)}</div>
      <div id="d-def" class="dpanel" style="display:none;">${definitionPanelHtml(model)}</div>
    </div>
  </div>
</div>
</div>

<script>
document.querySelectorAll('.navbtn').forEach(function(btn){
  btn.addEventListener('click', function(){
    document.querySelectorAll('.dpanel').forEach(function(p){ p.style.display = 'none'; });
    document.getElementById(btn.dataset.panel).style.display = 'block';
    document.querySelectorAll('.navbtn').forEach(function(b){ b.style.background = 'transparent'; b.style.color = 'var(--text-primary)'; });
    btn.style.background = 'var(--bg-accent)'; btn.style.color = 'var(--text-accent)';
  });
});
document.querySelectorAll('.kpi-item').forEach(function(item){
  item.addEventListener('click', function(){
    document.querySelectorAll('.dpanel').forEach(function(p){ p.style.display = 'none'; });
    document.getElementById('d-def').style.display = 'block';
    document.querySelectorAll('.defblock').forEach(function(b){ b.style.display = 'none'; });
    document.getElementById('def-' + item.dataset.category).style.display = 'block';
    document.querySelectorAll('.navbtn').forEach(function(b){ b.style.background = 'transparent'; b.style.color = 'var(--text-primary)'; });
    var defNavBtn = document.querySelector('.navbtn[data-panel="d-def"]');
    if (defNavBtn) { defNavBtn.style.background = 'var(--bg-accent)'; defNavBtn.style.color = 'var(--text-accent)'; }
  });
});
</script>
</body>
</html>`;
}
