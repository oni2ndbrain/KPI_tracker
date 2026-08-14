import { describe, expect, test } from "vitest";
import { createInMemoryGmailClient } from "./fakes/in-memory-gmail-client.js";

describe("InMemoryGmailClient", () => {
  test("records every sent message", async () => {
    const client = createInMemoryGmailClient();

    await client.send({ to: "kate2676@gmail.com", subject: "[KPI 리포트] 주간 요약", html: "<p>hi</p>" });

    expect(client.sent).toEqual([
      { to: "kate2676@gmail.com", subject: "[KPI 리포트] 주간 요약", html: "<p>hi</p>" },
    ]);
  });
});
