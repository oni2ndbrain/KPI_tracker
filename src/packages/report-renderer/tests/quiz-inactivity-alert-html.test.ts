import { describe, expect, test } from "vitest";
import type { QuizInactivityAlertData } from "../../kpi-engine/index.js";
import { quizInactivityAlertSubject, renderQuizInactivityAlertEmail } from "../index.js";

const dataWithHistory: QuizInactivityAlertData = {
  daysSinceLastQuiz: 9,
  generatedAt: "2026-08-14T00:00:00.000Z",
};

const dataNeverTaken: QuizInactivityAlertData = {
  daysSinceLastQuiz: null,
  generatedAt: "2026-08-14T00:00:00.000Z",
};

describe("renderQuizInactivityAlertEmail", () => {
  test("renders plain HTML/CSS only — no <script> or <canvas>", () => {
    const html = renderQuizInactivityAlertEmail(dataWithHistory, { dashboardUrl: "https://dashboard.example/kpi" });

    expect(html.toLowerCase()).not.toContain("<script");
    expect(html.toLowerCase()).not.toContain("<canvas");
  });

  test("includes a link to the management dashboard", () => {
    const html = renderQuizInactivityAlertEmail(dataWithHistory, { dashboardUrl: "https://dashboard.example/kpi" });

    expect(html).toContain("https://dashboard.example/kpi");
  });

  test("names the number of days since the last quiz", () => {
    const html = renderQuizInactivityAlertEmail(dataWithHistory, { dashboardUrl: "https://dashboard.example/kpi" });

    expect(html).toContain("9일");
  });

  test("with quiz history matches the agreed golden layout", () => {
    const html = renderQuizInactivityAlertEmail(dataWithHistory, { dashboardUrl: "https://dashboard.example/kpi" });

    expect(html).toMatchSnapshot();
  });

  test("with no quiz ever taken matches the agreed golden layout", () => {
    const html = renderQuizInactivityAlertEmail(dataNeverTaken, { dashboardUrl: "https://dashboard.example/kpi" });

    expect(html).toMatchSnapshot();
  });
});

describe("quizInactivityAlertSubject", () => {
  test("has a fixed, friendly subject line", () => {
    expect(quizInactivityAlertSubject()).toBe("[KPI 알림] 역량 진단 퀴즈, 이번 주 어때요?");
  });
});
