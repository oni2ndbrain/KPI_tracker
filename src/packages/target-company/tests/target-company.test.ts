import { describe, expect, test } from "vitest";
import { createTargetCompanyTracker } from "../index.js";
import { createFakeCalendarClient } from "./fakes/fake-calendar-client.js";
import { createFakeKpiStorage } from "./fakes/fake-kpi-storage.js";
import { createFakeLlmWikiSearch } from "./fakes/fake-llm-wiki-search.js";
import { createFakeTargetCompanyStorage } from "./fakes/fake-target-company-storage.js";
import { createFixtureJdExtractionClient } from "./fakes/fixture-jd-extraction-client.js";

function trackerWithFixtures() {
  const jdExtractor = createFixtureJdExtractionClient({
    "samsung-jd": {
      competencies: ["반도체 공정 이해", "통계적 공정관리(SPC)", "Python 데이터 분석", "품질관리(6시그마)"],
      deadline: "2026-09-30",
    },
    "skhynix-jd": {
      competencies: ["메모리 공정 이해", "수율 분석"],
      deadline: "2026-10-15",
    },
  });
  const wikiSearch = createFakeLlmWikiSearch(["반도체 공정 이해", "Python 데이터 분석"]);
  const kpiStorage = createFakeKpiStorage();
  const targetCompanyStorage = createFakeTargetCompanyStorage();
  const calendarClient = createFakeCalendarClient();

  return createTargetCompanyTracker({ jdExtractor, wikiSearch, kpiStorage, targetCompanyStorage, calendarClient });
}

describe("createTargetCompanyTracker: register", () => {
  test("extracts required competencies and deadline from the JD text", async () => {
    const tracker = trackerWithFixtures();

    const company = await tracker.register({ id: "samsung", name: "삼성전자", jdText: "samsung-jd" });

    expect(company.requiredCompetencies).toEqual([
      "반도체 공정 이해",
      "통계적 공정관리(SPC)",
      "Python 데이터 분석",
      "품질관리(6시그마)",
    ]);
    expect(company.deadline).toBe("2026-09-30");
  });

  test("identifies the gap between required competencies and what the LLM Wiki already covers", async () => {
    const tracker = trackerWithFixtures();

    const company = await tracker.register({ id: "samsung", name: "삼성전자", jdText: "samsung-jd" });

    expect(company.gap).toEqual(["통계적 공정관리(SPC)", "품질관리(6시그마)"]);
  });

  test("creates and saves a 역량 채우기 KPI targeting the full competency count", async () => {
    const jdExtractor = createFixtureJdExtractionClient({
      "samsung-jd": { competencies: ["a", "b", "c", "d"], deadline: "2026-09-30" },
    });
    const wikiSearch = createFakeLlmWikiSearch([]);
    const kpiStorage = createFakeKpiStorage();
    const targetCompanyStorage = createFakeTargetCompanyStorage();
    const calendarClient = createFakeCalendarClient();
    const tracker = createTargetCompanyTracker({ jdExtractor, wikiSearch, kpiStorage, targetCompanyStorage, calendarClient });

    const company = await tracker.register({ id: "samsung", name: "삼성전자", jdText: "samsung-jd" });

    expect(company.kpiId).toBe("samsung-competency-fill");
    const savedKpi = await kpiStorage.load("samsung-competency-fill");
    expect(savedKpi?.definition).toEqual({
      id: "samsung-competency-fill",
      name: "삼성전자 역량 채우기",
      category: "competency-fill",
      target: 4,
    });
  });

  test("seeds the 역량 채우기 KPI's initial progress from competencies the LLM Wiki already covers", async () => {
    const jdExtractor = createFixtureJdExtractionClient({
      "samsung-jd": { competencies: ["a", "b", "c", "d"], deadline: "2026-09-30" },
    });
    const wikiSearch = createFakeLlmWikiSearch(["a", "c"]);
    const kpiStorage = createFakeKpiStorage();
    const targetCompanyStorage = createFakeTargetCompanyStorage();
    const calendarClient = createFakeCalendarClient();
    const tracker = createTargetCompanyTracker({ jdExtractor, wikiSearch, kpiStorage, targetCompanyStorage, calendarClient });

    const company = await tracker.register({ id: "samsung", name: "삼성전자", jdText: "samsung-jd" });

    const savedKpi = await kpiStorage.load(company.kpiId);
    expect(savedKpi?.currentValue).toBe(2);
    expect(savedKpi?.achievementRate).toBe(0.5);
  });

  test("a target company with no LLM Wiki coverage starts its KPI at zero", async () => {
    const jdExtractor = createFixtureJdExtractionClient({
      "samsung-jd": { competencies: ["a", "b", "c", "d"], deadline: "2026-09-30" },
    });
    const wikiSearch = createFakeLlmWikiSearch([]);
    const kpiStorage = createFakeKpiStorage();
    const targetCompanyStorage = createFakeTargetCompanyStorage();
    const calendarClient = createFakeCalendarClient();
    const tracker = createTargetCompanyTracker({ jdExtractor, wikiSearch, kpiStorage, targetCompanyStorage, calendarClient });

    const company = await tracker.register({ id: "samsung", name: "삼성전자", jdText: "samsung-jd" });

    const savedKpi = await kpiStorage.load(company.kpiId);
    expect(savedKpi?.currentValue).toBe(0);
  });

  test("persists the registered target company (name/deadline/gap), not just its derived KPI", async () => {
    const jdExtractor = createFixtureJdExtractionClient({
      "samsung-jd": { competencies: ["a", "b", "c", "d"], deadline: "2026-09-30" },
    });
    const wikiSearch = createFakeLlmWikiSearch(["a"]);
    const kpiStorage = createFakeKpiStorage();
    const targetCompanyStorage = createFakeTargetCompanyStorage();
    const calendarClient = createFakeCalendarClient();
    const tracker = createTargetCompanyTracker({ jdExtractor, wikiSearch, kpiStorage, targetCompanyStorage, calendarClient });

    const company = await tracker.register({ id: "samsung", name: "삼성전자", jdText: "samsung-jd" });

    expect(await targetCompanyStorage.list()).toEqual([company]);
  });

  test("writes the extracted deadline to the calendar as an all-day event", async () => {
    const calendarClient = createFakeCalendarClient();
    const jdExtractor = createFixtureJdExtractionClient({
      "samsung-jd": { competencies: ["a", "b", "c", "d"], deadline: "2026-09-30" },
    });
    const wikiSearch = createFakeLlmWikiSearch([]);
    const kpiStorage = createFakeKpiStorage();
    const targetCompanyStorage = createFakeTargetCompanyStorage();
    const tracker = createTargetCompanyTracker({ jdExtractor, wikiSearch, kpiStorage, targetCompanyStorage, calendarClient });

    await tracker.register({ id: "samsung", name: "삼성전자", jdText: "samsung-jd" });

    expect(calendarClient.created).toHaveLength(1);
    expect(calendarClient.created[0]).toMatchObject({
      title: "삼성전자 지원 마감일",
      start: "2026-09-30",
      end: "2026-10-01",
    });
  });

  test("tracks two or more target companies independently", async () => {
    const tracker = trackerWithFixtures();

    const samsung = await tracker.register({ id: "samsung", name: "삼성전자", jdText: "samsung-jd" });
    const skhynix = await tracker.register({ id: "skhynix", name: "SK하이닉스", jdText: "skhynix-jd" });

    expect(tracker.list()).toHaveLength(2);
    expect(tracker.get("samsung")).toEqual(samsung);
    expect(tracker.get("skhynix")).toEqual(skhynix);
    expect(samsung.kpiId).not.toBe(skhynix.kpiId);
    expect(skhynix.gap).toEqual(["메모리 공정 이해", "수율 분석"]);
  });
});

describe("createTargetCompanyTracker: get/list", () => {
  test("returns undefined for a target company that was never registered", () => {
    const tracker = trackerWithFixtures();

    expect(tracker.get("nonexistent")).toBeUndefined();
  });

  test("lists no companies before any registration", () => {
    const tracker = trackerWithFixtures();

    expect(tracker.list()).toEqual([]);
  });
});
