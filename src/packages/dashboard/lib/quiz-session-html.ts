import { escapeHtml } from "../../report-renderer/index.js";
import type { QuizAnswerRecord, QuizQuestion } from "../../kpi-engine/index.js";
import { macChromeHtml, PAGE_STYLE } from "./dashboard-html.js";

// These render the transient action pages (퀴즈 진행 중 / 채점 결과 / 조작 오류) that the 관리 화면's
// write actions redirect through — kept separate from dashboard-html.ts's read-only panels, but
// sharing its palette/chrome so the whole app looks like one piece.

function pageShellHtml(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title)} · KPI_tracker</title>
<style>${PAGE_STYLE}</style>
</head>
<body>
<div class="wrap">
<div style="border: 0.5px solid var(--border); border-radius: 12px; overflow: hidden;">
  ${macChromeHtml("KPI_tracker")}
  <div style="background: var(--surface-2); padding: 1.25rem;">
    ${bodyHtml}
  </div>
</div>
</div>
</body>
</html>`;
}

function backToDashboardLinkHtml(): string {
  return `<p style="margin-top:16px;"><a href="/" style="font-size:13px; color:var(--text-accent);">← 대시보드로 돌아가기</a></p>`;
}

function quizQuestionFormHtml(companyId: string, question: QuizQuestion): string {
  return (
    `<div style="background: var(--surface-0); border: 0.5px solid var(--border); border-radius: 10px; padding: 14px; margin-bottom:12px;">` +
    `<p style="font-size:11px; color:var(--text-muted); margin:0 0 6px;">${escapeHtml(question.competency)}</p>` +
    `<p style="font-size:13px; margin:0 0 10px;">${escapeHtml(question.prompt)}</p>` +
    `<form method="post" action="/actions/submit-quiz-answer">` +
    `<input type="hidden" name="companyId" value="${escapeHtml(companyId)}">` +
    `<input type="hidden" name="questionId" value="${escapeHtml(question.id)}">` +
    `<input type="hidden" name="competency" value="${escapeHtml(question.competency)}">` +
    `<input type="hidden" name="prompt" value="${escapeHtml(question.prompt)}">` +
    `<textarea name="answerText" rows="4" required placeholder="답변을 입력해주세요 (음성 입력으로 텍스트화한 답도 좋아요)" style="width:100%; box-sizing:border-box; font-size:13px; padding:8px; border:0.5px solid var(--border); border-radius:6px; font-family:inherit; resize:vertical;"></textarea>` +
    `<button type="submit" style="margin-top:8px; font-size:13px; font-weight:500; color:var(--text-accent); background:var(--bg-accent); padding:7px 14px; border-radius:6px;">채점 요청</button>` +
    `</form>` +
    `</div>`
  );
}

export interface QuizQuestionsPageInput {
  companyId: string;
  companyName: string;
  questions: QuizQuestion[];
}

export function renderQuizQuestionsPage(input: QuizQuestionsPageInput): string {
  const body =
    `<p style="font-size:13px; font-weight:500; margin:0 0 4px;">${escapeHtml(input.companyName)} 역량 진단 퀴즈</p>` +
    `<p style="font-size:12px; color:var(--text-secondary); margin:0 0 14px;">문항마다 답변을 적고 "채점 요청"을 눌러주세요. 문항 하나씩 채점돼요.</p>` +
    input.questions.map((question) => quizQuestionFormHtml(input.companyId, question)).join("") +
    backToDashboardLinkHtml();

  return pageShellHtml(`${input.companyName} 역량 진단`, body);
}

export interface QuizAnswerResultPageInput {
  /** Present when the answered question came from a target company's quiz session, so a "이 회사
   * 문제 더 풀기" shortcut can be offered — absent for a standalone answer. */
  companyId: string | null;
  record: QuizAnswerRecord;
}

export function renderQuizAnswerResultPage(input: QuizAnswerResultPageInput): string {
  const { record } = input;
  const feedback = [
    record.referencesPersonalExperience
      ? "본인 경험과 연관 지어 설명했어요."
      : "본인 경험과 연관 지어 설명하면 더 좋아요.",
    record.isStructured
      ? "현상 → 후속공정 영향 → 원인 → 해결 구조로 잘 정리했어요."
      : "현상 → 후속공정 영향 → 원인 → 해결 순서로 구조화하면 더 좋아요.",
  ];

  const continueLink = input.companyId
    ? `<form method="post" action="/actions/start-quiz" style="margin-top:8px;">` +
      `<input type="hidden" name="companyId" value="${escapeHtml(input.companyId)}">` +
      `<button type="submit" style="font-size:13px; color:var(--text-accent); text-decoration:underline;">이 회사 문제 더 풀기</button>` +
      `</form>`
    : "";

  const body =
    `<p style="font-size:13px; font-weight:500; margin:0 0 4px;">${escapeHtml(record.competency)} 채점 결과</p>` +
    `<div style="background: var(--surface-0); border: 0.5px solid var(--border); border-radius: 10px; padding: 14px; margin-top:10px;">` +
    `<p style="font-size:24px; font-weight:600; margin:0 0 10px; color:var(--text-accent);">${record.score}<span style="font-size:13px; color:var(--text-secondary);">/5</span></p>` +
    `<ul style="margin:0; padding-left:18px; font-size:13px; color:var(--text-secondary);">${feedback.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>` +
    `</div>` +
    continueLink +
    backToDashboardLinkHtml();

  return pageShellHtml("채점 결과", body);
}

/** Shown when a write action fails (bad JD paste format, unknown id, …) instead of a bare 500. */
export function renderActionErrorPage(message: string): string {
  const body =
    `<p style="font-size:13px; font-weight:500; margin:0 0 10px; color:var(--text-danger);">문제가 발생했어요</p>` +
    `<p style="font-size:13px; color:var(--text-secondary); margin:0;">${escapeHtml(message)}</p>` +
    backToDashboardLinkHtml();
  return pageShellHtml("오류", body);
}
