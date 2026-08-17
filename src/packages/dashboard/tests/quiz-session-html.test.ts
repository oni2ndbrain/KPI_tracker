import { describe, expect, test } from "vitest";
import type { QuizAnswerRecord, QuizQuestion } from "../../kpi-engine/index.js";
import { renderActionErrorPage, renderQuizAnswerResultPage, renderQuizQuestionsPage } from "../index.js";

const questions: QuizQuestion[] = [
  { id: "q1", competency: "SPC", prompt: "SPC 이상점 대응 경험을 설명해주세요." },
  { id: "q2", competency: "품질관리", prompt: "6시그마 적용 사례를 설명해주세요." },
];

describe("renderQuizQuestionsPage", () => {
  test("renders one self-contained answer form per question, posting to submit-quiz-answer", () => {
    const html = renderQuizQuestionsPage({ companyId: "samsung", companyName: "삼성전자", questions });

    expect(html).toContain("삼성전자 역량 진단 퀴즈");
    expect((html.match(/action="\/actions\/submit-quiz-answer"/g) ?? []).length).toBe(2);
    expect(html).toContain('name="questionId" value="q1"');
    expect(html).toContain('name="questionId" value="q2"');
    expect(html).toContain('name="companyId" value="samsung"');
    expect(html).toContain("SPC 이상점 대응 경험을 설명해주세요.");
  });

  test("links back to the dashboard", () => {
    const html = renderQuizQuestionsPage({ companyId: "samsung", companyName: "삼성전자", questions });

    expect(html).toContain('href="/"');
  });
});

function answerRecord(overrides: Partial<QuizAnswerRecord> = {}): QuizAnswerRecord {
  return {
    id: "q1@2026-08-17T00:00:00.000Z",
    questionId: "q1",
    competency: "SPC",
    questionPrompt: "SPC 이상점 대응 경험을 설명해주세요.",
    answerText: "답변",
    score: 4,
    referencesPersonalExperience: true,
    isStructured: true,
    answeredAt: "2026-08-17T00:00:00.000Z",
    ...overrides,
  };
}

describe("renderQuizAnswerResultPage", () => {
  test("shows the score and positive feedback for a strong answer", () => {
    const html = renderQuizAnswerResultPage({ companyId: "samsung", record: answerRecord({ score: 5 }) });

    expect(html).toContain(">5<");
    expect(html).toContain("본인 경험과 연관 지어 설명했어요.");
    expect(html).toContain("현상 → 후속공정 영향 → 원인 → 해결 구조로 잘 정리했어요.");
  });

  test("shows improvement suggestions for a weak answer", () => {
    const html = renderQuizAnswerResultPage({
      companyId: "samsung",
      record: answerRecord({ score: 1, referencesPersonalExperience: false, isStructured: false }),
    });

    expect(html).toContain("본인 경험과 연관 지어 설명하면 더 좋아요.");
    expect(html).toContain("구조화하면 더 좋아요.");
  });

  test("offers a 이 회사 문제 더 풀기 shortcut when a companyId is given", () => {
    const html = renderQuizAnswerResultPage({ companyId: "samsung", record: answerRecord() });

    expect(html).toContain("이 회사 문제 더 풀기");
    expect(html).toContain('name="companyId" value="samsung"');
  });

  test("omits the shortcut when no companyId is given", () => {
    const html = renderQuizAnswerResultPage({ companyId: null, record: answerRecord() });

    expect(html).not.toContain("이 회사 문제 더 풀기");
  });
});

describe("renderActionErrorPage", () => {
  test("shows the error message and a way back to the dashboard", () => {
    const html = renderActionErrorPage("채용공고에서 자격요건을 찾을 수 없어요.");

    expect(html).toContain("채용공고에서 자격요건을 찾을 수 없어요.");
    expect(html).toContain('href="/"');
  });
});
