import { createGmailAuthFromEnv, createGoogleApiGmailClient } from "../src/packages/gmail/google-gmail.js";
import { buildQuizInactivityAlertData, shouldSendQuizInactivityAlert } from "../src/packages/kpi-engine/index.js";
import { createDriveAuthFromEnv, createGoogleApiDriveClient } from "../src/packages/kpi-storage/google-drive.js";
import { createQuizActivityStorage } from "../src/packages/kpi-storage/index.js";
import { quizInactivityAlertSubject, renderQuizInactivityAlertEmail } from "../src/packages/report-renderer/index.js";

const recipient = process.env.REPORT_RECIPIENT_EMAIL;
if (!recipient) throw new Error("Missing REPORT_RECIPIENT_EMAIL in environment.");

const dashboardUrl = process.env.DASHBOARD_URL ?? "https://kpi-tracker.example/dashboard";
const today = process.env.TODAY ?? new Date().toISOString();

const drive = createGoogleApiDriveClient(createDriveAuthFromEnv());
const quizActivityStorage = createQuizActivityStorage(drive);

const lastQuizAt = await quizActivityStorage.lastCompletedAt();
const input = { lastQuizAt, today };

if (!shouldSendQuizInactivityAlert(input)) {
  console.log("OK: no quiz-inactivity alert needed today.");
} else {
  const alert = buildQuizInactivityAlertData(input);
  const html = renderQuizInactivityAlertEmail(alert, { dashboardUrl });
  const subject = quizInactivityAlertSubject(alert);

  const gmailClient = createGoogleApiGmailClient(createGmailAuthFromEnv());
  await gmailClient.send({ to: recipient, subject, html });
  console.log(`OK: sent quiz-inactivity alert to ${recipient}.`);
}
