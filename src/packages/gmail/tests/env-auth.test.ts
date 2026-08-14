import { describe, expect, test } from "vitest";
import { createGmailAuthFromEnv } from "../google-gmail.js";

describe("createGmailAuthFromEnv", () => {
  test("builds an OAuth2 client from complete credentials", () => {
    const auth = createGmailAuthFromEnv({
      GOOGLE_GMAIL_CLIENT_ID: "client-id",
      GOOGLE_GMAIL_CLIENT_SECRET: "client-secret",
      GOOGLE_GMAIL_REFRESH_TOKEN: "refresh-token",
    } as NodeJS.ProcessEnv);

    expect(auth.credentials.refresh_token).toBe("refresh-token");
  });

  test("throws naming every missing credential", () => {
    expect(() => createGmailAuthFromEnv({} as NodeJS.ProcessEnv)).toThrow(
      /GOOGLE_GMAIL_CLIENT_ID.*GOOGLE_GMAIL_CLIENT_SECRET.*GOOGLE_GMAIL_REFRESH_TOKEN/s,
    );
  });
});
