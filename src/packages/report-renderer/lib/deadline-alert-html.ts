import type { DeadlineAlertData } from "../../kpi-engine/index.js";
import { WEAK_RED } from "./palette.js";
import { banner, dashboardButtonRow, dateOnly, escapeHtml, messageBox, pct, section } from "./html-helpers.js";

export interface RenderDeadlineAlertOptions {
  dashboardUrl: string;
}

export function renderDeadlineAlertEmail(data: DeadlineAlertData, options: RenderDeadlineAlertOptions): string {
  const progressBody = `<p style="font-size:13px;color:#0b0b0b;margin:0;">` +
    `${escapeHtml(data.kpiName)}: 현재 달성률 <strong>${pct(data.achievementRate)}</strong> · 마감일 ${dateOnly(data.deadline)}` +
    `</p>`;

  return `<!DOCTYPE html>
<html lang="ko">
<body style="margin:0;padding:0;background:#f1efe8;font-family:-apple-system,'Segoe UI',sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1efe8;padding:24px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
<tr><td style="background:#0b0b0b;color:#ffffff;padding:20px 24px;font-size:18px;font-weight:600;">KPI 마감일 알림</td></tr>
<tr><td style="padding:16px 24px 0;font-size:12px;color:#898781;">생성일: ${dateOnly(data.generatedAt)}</td></tr>
${banner(WEAK_RED.bg, WEAK_RED.text, `⏰ D-${data.daysUntilDeadline}! ${escapeHtml(data.targetCompanyName)} 지원 마감이 다가와요`)}
${section("현재 진행률", progressBody)}
${section("지금 해야 할 일", messageBox(data.actionMessage))}
${dashboardButtonRow(options.dashboardUrl)}
</table>
</td></tr>
</table>
</body>
</html>`;
}

export function deadlineAlertSubject(data: DeadlineAlertData): string {
  return `[KPI 알림] ${data.targetCompanyName} 지원 마감 D-${data.daysUntilDeadline}`;
}
