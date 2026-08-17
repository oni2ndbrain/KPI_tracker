import { describe, expect, test } from "vitest";
import { createHeuristicJdExtractionClient } from "../index.js";
import { samsungProcessEngineerJdFixture } from "./fixtures/samsung-process-engineer-jd.js";

describe("createHeuristicJdExtractionClient", () => {
  // Unlike the LLM-backed fixture (jd-extraction.test.ts), the heuristic client extracts the raw
  // 자격요건 phrasing verbatim rather than paraphrasing it — no LLM call involved.
  test("extracts the raw competency phrasing and deadline from a real-shaped JD", async () => {
    const client = createHeuristicJdExtractionClient();

    const result = await client.extract(samsungProcessEngineerJdFixture.jdText);

    expect(result).toEqual({
      competencies: [
        "반도체 공정에 대한 이해",
        "통계적 공정관리(SPC) 경험",
        "Python/R을 활용한 데이터 분석",
        "품질관리(6시그마) 이해",
      ],
      deadline: samsungProcessEngineerJdFixture.expected.deadline,
    });
  });

  test("trims whitespace around each extracted competency", async () => {
    const client = createHeuristicJdExtractionClient();

    const result = await client.extract("자격요건:  역량A ,  역량B\n지원마감: 2026-09-30");

    expect(result.competencies).toEqual(["역량A", "역량B"]);
  });

  test("accepts '요구 역량:' as an alternate header", async () => {
    const client = createHeuristicJdExtractionClient();

    const result = await client.extract("요구 역량: 역량A, 역량B\n지원마감: 2026-09-30");

    expect(result.competencies).toEqual(["역량A", "역량B"]);
  });

  test("throws a helpful error when no 자격요건 line is present", async () => {
    const client = createHeuristicJdExtractionClient();

    await expect(client.extract("지원마감: 2026-09-30")).rejects.toThrow(/자격요건/);
  });

  test("throws a helpful error when no YYYY-MM-DD deadline is present", async () => {
    const client = createHeuristicJdExtractionClient();

    await expect(client.extract("자격요건: 역량A")).rejects.toThrow(/마감일/);
  });
});
