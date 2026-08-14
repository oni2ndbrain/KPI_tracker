import type { EmailMessage, GmailClient } from "../../index.js";

export interface InMemoryGmailClient extends GmailClient {
  sent: EmailMessage[];
}

/** In-memory stand-in for Gmail, used only in tests — never sends real email. */
export function createInMemoryGmailClient(): InMemoryGmailClient {
  const sent: EmailMessage[] = [];

  return {
    sent,
    async send(message) {
      sent.push(message);
    },
  };
}
