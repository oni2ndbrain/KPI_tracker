import { auth } from "@googleapis/gmail";

export type OAuth2Client = InstanceType<typeof auth.OAuth2>;

const REQUIRED_VARS = [
  "GOOGLE_GMAIL_CLIENT_ID",
  "GOOGLE_GMAIL_CLIENT_SECRET",
  "GOOGLE_GMAIL_REFRESH_TOKEN",
] as const;

/** Builds an authenticated client from OAuth credentials in the environment. Provisioning those
 * credentials (GCP project, OAuth consent screen, refresh token with gmail.send scope) is a
 * one-off human step — see scripts/setup-gmail-credentials.sh. */
export function createGmailAuthFromEnv(env: NodeJS.ProcessEnv = process.env): OAuth2Client {
  const missing = REQUIRED_VARS.filter((name) => !env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing Gmail credentials in environment: ${missing.join(", ")}`);
  }

  const client = new auth.OAuth2(env.GOOGLE_GMAIL_CLIENT_ID, env.GOOGLE_GMAIL_CLIENT_SECRET);
  client.setCredentials({ refresh_token: env.GOOGLE_GMAIL_REFRESH_TOKEN });
  return client;
}
