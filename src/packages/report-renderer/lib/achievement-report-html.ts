import type { AchievementReportData } from "../../kpi-engine/index.js";
import { paletteFor } from "./palette.js";
import {
  banner,
  dashboardButtonRow,
  dateOnly,
  emptyOr,
  escapeHtml,
  factsTable,
  renderAchievementItem,
  renderProposalBox,
  renderWeakItem,
  section,
} from "./html-helpers.js";

export interface RenderAchievementReportOptions {
  dashboardUrl: string;
}

function achievementBanner(data: AchievementReportData): string {
  const palette = paletteFor(data.achievedKpi.category);
  return banner(palette.bg, palette.text, `🎉 목표 달성! ${escapeHtml(data.achievedKpi.kpiName)}`);
}

export function renderAchievementReportEmail(data: AchievementReportData, options: RenderAchievementReportOptions): string {
  const whatWasDoneBody = emptyOr(data.whatWasDone, "이번 기간에 새로 발굴된 성과가 없어요.", (achievements) =>
    `<ul style="margin:0;padding-left:18px;">${achievements.map(renderAchievementItem).join("")}</ul>`,
  );

  const laggingSuggestionBody = data.laggingSuggestion
    ? renderProposalBox(data.laggingSuggestion)
    : `<p style="font-size:13px;color:#52514e;margin:0;">뒤처진 항목이 없어요. 모든 KPI가 목표를 달성했어요.</p>`;

  const weakItemsBody = emptyOr(data.weakItems, "취약 항목이 없어요.", (weakItems) =>
    `<ul style="margin:0;padding-left:18px;">${weakItems.map(renderWeakItem).join("")}</ul>`,
  );

  return `<!DOCTYPE html>
<html lang="ko">
<body style="margin:0;padding:0;background:#f1efe8;font-family:-apple-system,'Segoe UI',sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1efe8;padding:24px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
<tr><td style="background:#0b0b0b;color:#ffffff;padding:20px 24px;font-size:18px;font-weight:600;">KPI 달성 리포트</td></tr>
<tr><td style="padding:16px 24px 0;font-size:12px;color:#898781;">생성일: ${dateOnly(data.generatedAt)}</td></tr>
${achievementBanner(data)}
${section("무엇을 했는지", whatWasDoneBody)}
${section("전체 역량 현황", factsTable(data.overallProgress))}
${section("취약 항목", weakItemsBody)}
${section("가장 뒤처진 항목", laggingSuggestionBody)}
${dashboardButtonRow(options.dashboardUrl)}
</table>
</td></tr>
</table>
</body>
</html>`;
}

export function achievementReportSubject(data: AchievementReportData): string {
  return `[KPI 달성] ${data.achievedKpi.kpiName} · ${dateOnly(data.generatedAt)}`;
}
