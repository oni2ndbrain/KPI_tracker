import { describe, expect, test } from "vitest";
import { createDriveAuthFromEnv } from "../google-drive.js";

describe("createDriveAuthFromEnv", () => {
  test("builds an OAuth2 client from complete credentials", () => {
    const auth = createDriveAuthFromEnv({
      GOOGLE_DRIVE_CLIENT_ID: "client-id",
      GOOGLE_DRIVE_CLIENT_SECRET: "client-secret",
      GOOGLE_DRIVE_REFRESH_TOKEN: "refresh-token",
    } as NodeJS.ProcessEnv);

    expect(auth.credentials.refresh_token).toBe("refresh-token");
  });

  test("throws naming every missing credential", () => {
    expect(() => createDriveAuthFromEnv({} as NodeJS.ProcessEnv)).toThrow(
      /GOOGLE_DRIVE_CLIENT_ID.*GOOGLE_DRIVE_CLIENT_SECRET.*GOOGLE_DRIVE_REFRESH_TOKEN/s,
    );
  });
});
