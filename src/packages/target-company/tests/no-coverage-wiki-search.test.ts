import { describe, expect, test } from "vitest";
import { createNoCoverageWikiSearch } from "../index.js";

describe("createNoCoverageWikiSearch", () => {
  test("treats every competency as uncovered", async () => {
    const wikiSearch = createNoCoverageWikiSearch();

    const covered = await wikiSearch.covered(["역량A", "역량B"]);

    expect(covered).toEqual([]);
  });
});
