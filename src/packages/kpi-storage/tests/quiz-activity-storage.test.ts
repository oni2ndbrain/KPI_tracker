import { describe, expect, test } from "vitest";
import { createQuizActivityStorage } from "../index.js";
import { createInMemoryDriveClient } from "./fakes/in-memory-drive-client.js";

describe("QuizActivityStorage", () => {
  test("before any quiz is recorded, there is no last-completed timestamp", async () => {
    const storage = createQuizActivityStorage(createInMemoryDriveClient());

    expect(await storage.lastCompletedAt()).toBeNull();
  });

  test("recording a completion makes it the last-completed timestamp", async () => {
    const storage = createQuizActivityStorage(createInMemoryDriveClient());

    await storage.recordCompletion("2026-08-10T00:00:00.000Z");

    expect(await storage.lastCompletedAt()).toBe("2026-08-10T00:00:00.000Z");
  });

  test("recording a later completion overwrites the previous one, not accumulates", async () => {
    const storage = createQuizActivityStorage(createInMemoryDriveClient());

    await storage.recordCompletion("2026-08-10T00:00:00.000Z");
    await storage.recordCompletion("2026-08-15T00:00:00.000Z");

    expect(await storage.lastCompletedAt()).toBe("2026-08-15T00:00:00.000Z");
  });
});
