import type { RegularReportData, ReportFact, ReportGap, ReportProposal } from "../../kpi-engine/index.js";
import type { Achievement } from "../../kpi-engine/index.js";
import { paletteFor, WEAK_RED } from "./palette.js";

export interface RenderRegularReportOptions {
  dashboardUrl: string;
}

const PERIOD_LABEL: Record<RegularReportData["period"], string> = {
  weekly: "주간 요약",
  monthly: "월간 심층 리포트",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function dateOnly(isoTimestamp: string): string {
  return isoTimestamp.slice(0, 10);
}

function pct(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

function barWidth(rate: number): number {
  return Math.max(0, Math.min(100, Math.round(rate * 100)));
}

function progressBar(rate: number, barColor: string): string {
  const width = barWidth(rate);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="height:8px;background:#e1e0d9;border-radius:4px;"><tr>` +
    `<td width="${width}%" style="background:${barColor};border-radius:4px;height:8px;font-size:0;line-height:0;">&nbsp;</td>` +
    `<td style="font-size:0;line-height:0;">&nbsp;</td>` +
    `</tr></table>`;
}

function renderFactRow(fact: ReportFact): string {
  const palette = paletteFor(fact.category);
  return `<tr>` +
    `<td style="padding:10px 8px;font-size:13px;color:#0b0b0b;">${escapeHtml(fact.kpiName)}</td>` +
    `<td style="padding:10px 8px;"><span style="display:inline-block;background:${palette.bg};color:${palette.text};border-radius:6px;padding:2px 8px;font-size:11px;font-weight:600;">${palette.label}</span></td>` +
    `<td style="padding:10px 8px;font-size:13px;color:${palette.value};text-align:right;font-weight:600;">${fact.currentValue} / ${fact.target}</td>` +
    `<td style="padding:10px 8px;width:120px;">${progressBar(fact.achievementRate, palette.bar)}</td>` +
    `<td style="padding:10px 8px;font-size:13px;color:#52514e;text-align:right;">${pct(fact.achievementRate)}</td>` +
    `</tr>`;
}

function renderGapRow(gap: ReportGap): string {
  return `<tr style="background:${WEAK_RED.bg};">` +
    `<td style="padding:10px 8px;font-size:13px;color:#0b0b0b;">${escapeHtml(gap.kpiName)}</td>` +
    `<td style="padding:10px 8px;font-size:13px;color:${WEAK_RED.text};font-weight:600;text-align:right;">${pct(gap.achievementRate)}</td>` +
    `<td style="padding:10px 8px;font-size:13px;color:${WEAK_RED.text};text-align:right;">${gap.remaining}</td>` +
    `</tr>`;
}

function renderProposalBox(proposal: ReportProposal): string {
  return `<div style="background:#f1efe8;border-left:4px solid #5DCAA5;border-radius:6px;padding:12px 16px;margin-bottom:10px;font-size:13px;color:#0b0b0b;">` +
    escapeHtml(proposal.message) +
    `</div>`;
}

function renderAchievementItem(achievement: Achievement): string {
  return `<li style="margin-bottom:6px;font-size:13px;color:#0b0b0b;">` +
    `<span style="color:#898781;">${dateOnly(achievement.discoveredAt)}</span> — ${escapeHtml(achievement.title)}` +
    `</li>`;
}

function section(title: string, bodyHtml: string): string {
  return `<tr><td style="padding:0 24px 24px;">` +
    `<h2 style="font-size:14px;color:#0b0b0b;margin:0 0 12px;">${title}</h2>` +
    bodyHtml +
    `</td></tr>`;
}

export function renderRegularReportEmail(data: RegularReportData, options: RenderRegularReportOptions): string {
  const factsTable = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">` +
    `<tr style="background:#f1efe8;"><th align="left" style="padding:8px;font-size:11px;color:#52514e;">항목</th><th align="left" style="padding:8px;font-size:11px;color:#52514e;">분류</th><th align="right" style="padding:8px;font-size:11px;color:#52514e;">현재/목표</th><th style="padding:8px;font-size:11px;color:#52514e;">진행률</th><th align="right" style="padding:8px;font-size:11px;color:#52514e;">달성률</th></tr>` +
    data.facts.map(renderFactRow).join("") +
    `</table>`;

  const gapsBody = data.gaps.length === 0
    ? `<p style="font-size:13px;color:#52514e;margin:0;">뒤처진 항목이 없어요. 잘하고 있어요.</p>`
    : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">` +
      `<tr><th align="left" style="padding:8px;font-size:11px;color:#52514e;">항목</th><th align="right" style="padding:8px;font-size:11px;color:#52514e;">달성률</th><th align="right" style="padding:8px;font-size:11px;color:#52514e;">남은 양</th></tr>` +
      data.gaps.map(renderGapRow).join("") +
      `</table>`;

  const proposalsBody = data.proposals.length === 0
    ? `<p style="font-size:13px;color:#52514e;margin:0;">지금은 제안할 항목이 없어요.</p>`
    : data.proposals.map(renderProposalBox).join("");

  const achievementsBody = data.recentAchievements.length === 0
    ? `<p style="font-size:13px;color:#52514e;margin:0;">이번 기간에 새로 발굴된 성과가 없어요.</p>`
    : `<ul style="margin:0;padding-left:18px;">${data.recentAchievements.map(renderAchievementItem).join("")}</ul>`;

  return `<!DOCTYPE html>
<html lang="ko">
<body style="margin:0;padding:0;background:#f1efe8;font-family:-apple-system,'Segoe UI',sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1efe8;padding:24px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
<tr><td style="background:#0b0b0b;color:#ffffff;padding:20px 24px;font-size:18px;font-weight:600;">KPI 정기 리포트 · ${PERIOD_LABEL[data.period]}</td></tr>
<tr><td style="padding:16px 24px 0;font-size:12px;color:#898781;">생성일: ${dateOnly(data.generatedAt)}</td></tr>
${section("팩트", factsTable)}
${section("갭", gapsBody)}
${section("제안", proposalsBody)}
${section("최근 성과", achievementsBody)}
<tr><td align="center" style="padding:8px 24px 28px;">
<a href="${options.dashboardUrl}" style="display:inline-block;background:#5DCAA5;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">관리 화면에서 자세히 보기</a>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export function regularReportSubject(data: RegularReportData): string {
  return `[KPI 리포트] ${PERIOD_LABEL[data.period]} · ${dateOnly(data.generatedAt)}`;
}
