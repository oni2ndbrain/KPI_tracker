import { describe, expect, test } from "vitest";
import { createHeuristicQuizGradingClient } from "../index.js";

function grade(answerText: string) {
  const client = createHeuristicQuizGradingClient();
  return client.grade({ competency: "SPC", questionPrompt: "설명해주세요.", answerText });
}

describe("createHeuristicQuizGradingClient", () => {
  test("a short generic answer scores the minimum", async () => {
    const result = await grade("잘 모르겠어요");

    expect(result.score).toBe(1);
    expect(result.referencesPersonalExperience).toBe(false);
    expect(result.isStructured).toBe(false);
  });

  test("detects personal-experience markers", async () => {
    const result = await grade("제가 SPC 관리도를 담당했던 경험이 있습니다");

    expect(result.referencesPersonalExperience).toBe(true);
  });

  test("requires at least two structure markers to count as structured", async () => {
    const oneMarker = await grade("문제의 원인은 이렇습니다");
    const twoMarkers = await grade("원인은 이렇고, 해결 방법은 이렇습니다");

    expect(oneMarker.isStructured).toBe(false);
    expect(twoMarkers.isStructured).toBe(true);
  });

  test("a substantial, personal, structured answer scores the maximum", async () => {
    const result = await grade(
      "제가 담당했던 공정에서 이상점이 발생했고, 후속공정 영향을 분석해 원인을 찾고 해결까지 진행했습니다.",
    );

    expect(result.score).toBe(5);
  });
});
