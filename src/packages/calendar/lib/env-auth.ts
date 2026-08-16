import { auth } from "@googleapis/calendar";

export type OAuth2Client = InstanceType<typeof auth.OAuth2>;

const REQUIRED_VARS = [
  "GOOGLE_CALENDAR_CLIENT_ID",
  "GOOGLE_CALENDAR_CLIENT_SECRET",
  "GOOGLE_CALENDAR_REFRESH_TOKEN",
] as const;

/** Builds an authenticated client from OAuth credentials in the environment. Provisioning those
 * credentials (GCP project, OAuth consent screen, refresh token with calendar scope) is a
 * one-off human step — see scripts/setup-google-calendar-credentials.sh. */
export function createCalendarAuthFromEnv(env: NodeJS.ProcessEnv = process.env): OAuth2Client {
  const missing = REQUIRED_VARS.filter((name) => !env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing Google Calendar credentials in environment: ${missing.join(", ")}`);
  }

  const client = new auth.OAuth2(env.GOOGLE_CALENDAR_CLIENT_ID, env.GOOGLE_CALENDAR_CLIENT_SECRET);
  client.setCredentials({ refresh_token: env.GOOGLE_CALENDAR_REFRESH_TOKEN });
  return client;
}
