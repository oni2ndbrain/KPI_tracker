import { gmail } from "@googleapis/gmail";
import type { GmailClient } from "./gmail-client.js";
import type { OAuth2Client } from "./env-auth.js";

function encodeSubject(subject: string): string {
  return `=?UTF-8?B?${Buffer.from(subject, "utf-8").toString("base64")}?=`;
}

function buildRawMessage(to: string, subject: string, html: string): string {
  const message = [
    `To: ${to}`,
    `Subject: ${encodeSubject(subject)}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=utf-8",
    "",
    html,
  ].join("\r\n");

  // Gmail's API wants the raw RFC 2822 message base64url-encoded (- and _ instead of + and /,
  // no padding), not plain base64.
  return Buffer.from(message, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Real Gmail-backed implementation of GmailClient. Never used in tests — see tests/fakes/. */
export function createGoogleApiGmailClient(auth: OAuth2Client): GmailClient {
  const client = gmail({ version: "v1", auth });

  return {
    async send({ to, subject, html }) {
      await client.users.messages.send({
        userId: "me",
        requestBody: { raw: buildRawMessage(to, subject, html) },
      });
    },
  };
}
