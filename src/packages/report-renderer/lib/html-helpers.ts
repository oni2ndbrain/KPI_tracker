import type { Achievement, ReportFact, ReportProposal, WeakItemReport } from "../../kpi-engine/index.js";
import { paletteFor, WEAK_RED } from "./palette.js";

// Shared by regular-report-html.ts and achievement-report-html.ts so the two email layouts stay
// visually identical wherever they render the same kind of data (fact rows, proposal boxes, …).

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function dateOnly(isoTimestamp: string): string {
  return isoTimestamp.slice(0, 10);
}

// Floored at 0 — a KPI corrected down by a wrong quiz answer can otherwise drive
// achievementRate negative, which would render as a misleading negative percentage.
export function pct(rate: number): string {
  return `${Math.max(0, Math.round(rate * 100))}%`;
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

export function factsTable(facts: ReportFact[]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">` +
    `<tr style="background:#f1efe8;"><th align="left" style="padding:8px;font-size:11px;color:#52514e;">항목</th><th align="left" style="padding:8px;font-size:11px;color:#52514e;">분류</th><th align="right" style="padding:8px;font-size:11px;color:#52514e;">현재/목표</th><th style="padding:8px;font-size:11px;color:#52514e;">진행률</th><th align="right" style="padding:8px;font-size:11px;color:#52514e;">달성률</th></tr>` +
    facts.map(renderFactRow).join("") +
    `</table>`;
}

export function messageBox(message: string): string {
  return `<div style="background:#f1efe8;border-left:4px solid #5DCAA5;border-radius:6px;padding:12px 16px;margin-bottom:10px;font-size:13px;color:#0b0b0b;">` +
    escapeHtml(message) +
    `</div>`;
}

export function renderProposalBox(proposal: ReportProposal): string {
  return messageBox(proposal.message);
}

/** The colored, celebratory/urgent banner row shared by achievement and deadline-alert emails —
 * the visual "this matters right now" signal at the top of the email. */
export function banner(bg: string, text: string, message: string): string {
  return `<tr><td style="padding:20px 24px 0;">` +
    `<div style="background:${bg};color:${text};border-radius:10px;padding:18px 20px;font-size:16px;font-weight:700;">` +
    message +
    `</div>` +
    `</td></tr>`;
}

export function renderAchievementItem(achievement: Achievement): string {
  return `<li style="margin-bottom:6px;font-size:13px;color:#0b0b0b;">` +
    `<span style="color:#898781;">${dateOnly(achievement.discoveredAt)}</span> — ${escapeHtml(achievement.title)}` +
    `</li>`;
}

const RECOMMENDATION_SOURCE_LABEL: Record<WeakItemReport["recommendation"]["source"], string> = {
  "llm-wiki": "LLM Wiki",
  "web-search": "새로 찾은 자료",
};

export function renderWeakItem(item: WeakItemReport): string {
  return `<li style="margin-bottom:8px;font-size:13px;color:#0b0b0b;">` +
    `<span style="display:inline-block;background:${WEAK_RED.bg};color:${WEAK_RED.text};border-radius:6px;padding:2px 8px;font-size:11px;font-weight:600;margin-right:6px;">${item.consecutiveWrongCount}회 연속 오답</span>` +
    `<strong>${escapeHtml(item.competency)}</strong><br/>` +
    `<span style="color:#52514e;">추천: ${escapeHtml(item.recommendation.title)} (${RECOMMENDATION_SOURCE_LABEL[item.recommendation.source]})</span>` +
    `</li>`;
}

export function emptyOr<T>(items: T[], emptyMessage: string, render: (items: T[]) => string): string {
  return items.length === 0
    ? `<p style="font-size:13px;color:#52514e;margin:0;">${emptyMessage}</p>`
    : render(items);
}

export function section(title: string, bodyHtml: string): string {
  return `<tr><td style="padding:0 24px 24px;">` +
    `<h2 style="font-size:14px;color:#0b0b0b;margin:0 0 12px;">${title}</h2>` +
    bodyHtml +
    `</td></tr>`;
}

export function dashboardButtonRow(dashboardUrl: string): string {
  return `<tr><td align="center" style="padding:8px 24px 28px;">` +
    `<a href="${dashboardUrl}" style="display:inline-block;background:#5DCAA5;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">관리 화면에서 자세히 보기</a>` +
    `</td></tr>`;
}
