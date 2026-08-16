import { createGmailAuthFromEnv, createGoogleApiGmailClient } from "../src/packages/gmail/google-gmail.js";
import { buildDeadlineAlertData, shouldSendDeadlineAlert } from "../src/packages/kpi-engine/index.js";
import { createDriveAuthFromEnv, createGoogleApiDriveClient } from "../src/packages/kpi-storage/google-drive.js";
import { createKpiStorage, createTargetCompanyStorage } from "../src/packages/kpi-storage/index.js";
import { deadlineAlertSubject, renderDeadlineAlertEmail } from "../src/packages/report-renderer/index.js";

const recipient = process.env.REPORT_RECIPIENT_EMAIL;
if (!recipient) throw new Error("Missing REPORT_RECIPIENT_EMAIL in environment.");

const dashboardUrl = process.env.DASHBOARD_URL ?? "https://kpi-tracker.example/dashboard";
// Overridable for deterministic runs (e.g. a manual re-check of a specific day); defaults to the
// real date for the daily cron.
const today = (process.env.TODAY ?? new Date().toISOString()).slice(0, 10);

const drive = createGoogleApiDriveClient(createDriveAuthFromEnv());
const kpiStorage = createKpiStorage(drive);
const targetCompanyStorage = createTargetCompanyStorage(drive);
const gmailClient = createGoogleApiGmailClient(createGmailAuthFromEnv());

const targetCompanies = await targetCompanyStorage.list();

let sent = 0;
for (const company of targetCompanies) {
  const kpi = await kpiStorage.load(company.kpiId);
  if (!kpi) continue;

  const input = { targetCompanyName: company.name, deadline: company.deadline, kpi, gap: company.gap, today };
  if (!shouldSendDeadlineAlert(input)) continue;

  const alert = buildDeadlineAlertData(input);
  const html = renderDeadlineAlertEmail(alert, { dashboardUrl });
  const subject = deadlineAlertSubject(alert);
  await gmailClient.send({ to: recipient, subject, html });
  sent++;
}

console.log(`OK: sent ${sent} deadline alert(s) to ${recipient} (checked ${targetCompanies.length} target compan${targetCompanies.length === 1 ? "y" : "ies"}).`);
