import type { RegularReportData, ReportGap } from "../../kpi-engine/index.js";
import { WEAK_RED } from "./palette.js";
import {
  dashboardButtonRow,
  dateOnly,
  emptyOr,
  escapeHtml,
  factsTable,
  pct,
  renderAchievementItem,
  renderProposalBox,
  renderWeakItem,
  section,
} from "./html-helpers.js";

export interface RenderRegularReportOptions {
  dashboardUrl: string;
}

const PERIOD_LABEL: Record<RegularReportData["period"], string> = {
  weekly: "주간 요약",
  monthly: "월간 심층 리포트",
};

function renderGapRow(gap: ReportGap): string {
  return `<tr style="background:${WEAK_RED.bg};">` +
    `<td style="padding:10px 8px;font-size:13px;color:#0b0b0b;">${escapeHtml(gap.kpiName)}</td>` +
    `<td style="padding:10px 8px;font-size:13px;color:${WEAK_RED.text};font-weight:600;text-align:right;">${pct(gap.achievementRate)}</td>` +
    `<td style="padding:10px 8px;font-size:13px;color:${WEAK_RED.text};text-align:right;">${gap.remaining}</td>` +
    `</tr>`;
}

export function renderRegularReportEmail(data: RegularReportData, options: RenderRegularReportOptions): string {
  const gapsBody = emptyOr(data.gaps, "뒤처진 항목이 없어요. 잘하고 있어요.", (gaps) =>
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">` +
      `<tr><th align="left" style="padding:8px;font-size:11px;color:#52514e;">항목</th><th align="right" style="padding:8px;font-size:11px;color:#52514e;">달성률</th><th align="right" style="padding:8px;font-size:11px;color:#52514e;">남은 양</th></tr>` +
      gaps.map(renderGapRow).join("") +
      `</table>`,
  );

  const proposalsBody = emptyOr(data.proposals, "지금은 제안할 항목이 없어요.", (proposals) =>
    proposals.map(renderProposalBox).join(""),
  );

  const achievementsBody = emptyOr(data.recentAchievements, "이번 기간에 새로 발굴된 성과가 없어요.", (achievements) =>
    `<ul style="margin:0;padding-left:18px;">${achievements.map(renderAchievementItem).join("")}</ul>`,
  );

  const weakItemsBody = emptyOr(data.weakItems, "취약 항목이 없어요.", (weakItems) =>
    `<ul style="margin:0;padding-left:18px;">${weakItems.map(renderWeakItem).join("")}</ul>`,
  );

  return `<!DOCTYPE html>
<html lang="ko">
<body style="margin:0;padding:0;background:#f1efe8;font-family:-apple-system,'Segoe UI',sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1efe8;padding:24px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
<tr><td style="background:#0b0b0b;color:#ffffff;padding:20px 24px;font-size:18px;font-weight:600;">KPI 정기 리포트 · ${PERIOD_LABEL[data.period]}</td></tr>
<tr><td style="padding:16px 24px 0;font-size:12px;color:#898781;">생성일: ${dateOnly(data.generatedAt)}</td></tr>
${section("팩트", factsTable(data.facts))}
${section("갭", gapsBody)}
${section("제안", proposalsBody)}
${section("취약 항목", weakItemsBody)}
${section("최근 성과", achievementsBody)}
${dashboardButtonRow(options.dashboardUrl)}
</table>
</td></tr>
</table>
</body>
</html>`;
}

export function regularReportSubject(data: RegularReportData): string {
  return `[KPI 리포트] ${PERIOD_LABEL[data.period]} · ${dateOnly(data.generatedAt)}`;
}
