import { describe, expect, test } from "vitest";
import { createEmptyWikiReader } from "../index.js";

describe("createEmptyWikiReader", () => {
  test("always lists no items", async () => {
    const reader = createEmptyWikiReader();

    expect(await reader.list()).toEqual([]);
  });
});
