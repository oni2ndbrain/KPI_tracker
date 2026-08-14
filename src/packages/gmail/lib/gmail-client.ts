export interface EmailMessage {
  to: string;
  subject: string;
  /** Full HTML body. Callers are responsible for keeping it plain HTML/CSS only (no script/canvas) —
   * this client sends whatever it's given. */
  html: string;
}

/** The narrow surface regular-report sending depends on. Production code sends through Gmail;
 * tests use an in-memory fake — never a live call. */
export interface GmailClient {
  send(message: EmailMessage): Promise<void>;
}
