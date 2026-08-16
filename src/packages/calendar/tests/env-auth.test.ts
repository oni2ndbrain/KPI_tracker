import { describe, expect, test } from "vitest";
import { createCalendarAuthFromEnv } from "../google-calendar.js";

describe("createCalendarAuthFromEnv", () => {
  test("builds an OAuth2 client from complete credentials", () => {
    const auth = createCalendarAuthFromEnv({
      GOOGLE_CALENDAR_CLIENT_ID: "client-id",
      GOOGLE_CALENDAR_CLIENT_SECRET: "client-secret",
      GOOGLE_CALENDAR_REFRESH_TOKEN: "refresh-token",
    } as NodeJS.ProcessEnv);

    expect(auth.credentials.refresh_token).toBe("refresh-token");
  });

  test("throws naming every missing credential", () => {
    expect(() => createCalendarAuthFromEnv({} as NodeJS.ProcessEnv)).toThrow(
      /GOOGLE_CALENDAR_CLIENT_ID.*GOOGLE_CALENDAR_CLIENT_SECRET.*GOOGLE_CALENDAR_REFRESH_TOKEN/s,
    );
  });
});
