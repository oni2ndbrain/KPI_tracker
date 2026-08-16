import { describe, expect, test } from "vitest";
import type { QuizAnswerRecord } from "../../kpi-engine/index.js";
import { createQuizResultStorage } from "../index.js";
import { createInMemoryDriveClient } from "./fakes/in-memory-drive-client.js";

function quizAnswerRecord(overrides: Partial<QuizAnswerRecord> = {}): QuizAnswerRecord {
  return {
    id: "q0@2026-08-17T00:00:00.000Z",
    questionId: "q0",
    competency: "통계적 공정관리(SPC)",
    questionPrompt: "SPC 관리도에서 이상점이 발생했을 때 어떻게 대응했는지 설명하세요.",
    answerText: "관리도 이탈을 발견하고 후속 공정 영향을 분석해 원인을 찾아 해결했습니다.",
    score: 4,
    referencesPersonalExperience: true,
    isStructured: true,
    answeredAt: "2026-08-17T00:00:00.000Z",
    ...overrides,
  };
}

describe("QuizResultStorage", () => {
  test("a saved quiz answer record can be listed back", async () => {
    const storage = createQuizResultStorage(createInMemoryDriveClient());
    const record = quizAnswerRecord();

    await storage.save(record);
    const loaded = await storage.list();

    expect(loaded).toEqual([record]);
  });

  test("listing before anything is saved returns an empty array", async () => {
    const storage = createQuizResultStorage(createInMemoryDriveClient());

    expect(await storage.list()).toEqual([]);
  });

  test("saving the same record id twice overwrites rather than duplicating it", async () => {
    const storage = createQuizResultStorage(createInMemoryDriveClient());
    const original = quizAnswerRecord({ score: 2 });

    await storage.save(original);
    const updated = quizAnswerRecord({ score: 4 });
    await storage.save(updated);

    const loaded = await storage.list();
    expect(loaded).toEqual([updated]);
  });

  test("accumulates multiple distinct answer records across saves", async () => {
    const storage = createQuizResultStorage(createInMemoryDriveClient());

    await storage.save(quizAnswerRecord({ id: "q0@t1", questionId: "q0" }));
    await storage.save(quizAnswerRecord({ id: "q1@t1", questionId: "q1" }));

    const loaded = await storage.list();
    expect(loaded.map((r) => r.id)).toEqual(["q0@t1", "q1@t1"]);
  });
});
