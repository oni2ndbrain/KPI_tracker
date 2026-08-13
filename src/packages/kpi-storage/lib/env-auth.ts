import { auth } from "@googleapis/drive";

export type OAuth2Client = InstanceType<typeof auth.OAuth2>;

const REQUIRED_VARS = [
  "GOOGLE_DRIVE_CLIENT_ID",
  "GOOGLE_DRIVE_CLIENT_SECRET",
  "GOOGLE_DRIVE_REFRESH_TOKEN",
] as const;

/** Builds an authenticated client from OAuth credentials in the environment. Provisioning those
 * credentials (GCP project, OAuth consent screen, refresh token) is a one-off human step — see /wizard. */
export function createDriveAuthFromEnv(env: NodeJS.ProcessEnv = process.env): OAuth2Client {
  const missing = REQUIRED_VARS.filter((name) => !env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing Google Drive credentials in environment: ${missing.join(", ")}`);
  }

  const client = new auth.OAuth2(env.GOOGLE_DRIVE_CLIENT_ID, env.GOOGLE_DRIVE_CLIENT_SECRET);
  client.setCredentials({ refresh_token: env.GOOGLE_DRIVE_REFRESH_TOKEN });
  return client;
}
