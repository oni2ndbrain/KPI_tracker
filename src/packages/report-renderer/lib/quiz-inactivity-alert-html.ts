import type { QuizInactivityAlertData } from "../../kpi-engine/index.js";
import { paletteFor } from "./palette.js";
import { banner, dashboardButtonRow, dateOnly, messageBox, section } from "./html-helpers.js";

export interface RenderQuizInactivityAlertOptions {
  dashboardUrl: string;
}

function inactivityMessage(data: QuizInactivityAlertData): string {
  return data.daysSinceLastQuiz === null
    ? "아직 역량 진단 퀴즈를 한 번도 안 해봤어요."
    : `역량 진단 퀴즈를 ${data.daysSinceLastQuiz}일째 쉬고 있어요.`;
}

export function renderQuizInactivityAlertEmail(data: QuizInactivityAlertData, options: RenderQuizInactivityAlertOptions): string {
  const palette = paletteFor("quiz-score");

  return `<!DOCTYPE html>
<html lang="ko">
<body style="margin:0;padding:0;background:#f1efe8;font-family:-apple-system,'Segoe UI',sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1efe8;padding:24px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
<tr><td style="background:#0b0b0b;color:#ffffff;padding:20px 24px;font-size:18px;font-weight:600;">KPI 역량 진단 퀴즈 알림</td></tr>
<tr><td style="padding:16px 24px 0;font-size:12px;color:#898781;">생성일: ${dateOnly(data.generatedAt)}</td></tr>
${banner(palette.bg, palette.text, `🧠 ${inactivityMessage(data)}`)}
${section("이번 주 진단해볼까요?", messageBox("역량 진단 퀴즈로 준비 상태를 점검해보세요. 관리 화면에서 바로 시작할 수 있어요."))}
${dashboardButtonRow(options.dashboardUrl)}
</table>
</td></tr>
</table>
</body>
</html>`;
}

export function quizInactivityAlertSubject(): string {
  return `[KPI 알림] 역량 진단 퀴즈, 이번 주 어때요?`;
}
