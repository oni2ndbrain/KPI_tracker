import { createGmailAuthFromEnv, createGoogleApiGmailClient } from "../src/packages/gmail/google-gmail.js";
import { buildAchievementReportData } from "../src/packages/kpi-engine/index.js";
import { createDriveAuthFromEnv, createGoogleApiDriveClient } from "../src/packages/kpi-storage/google-drive.js";
import { createAchievementStorage, createKpiStorage } from "../src/packages/kpi-storage/index.js";
import { achievementReportSubject, renderAchievementReportEmail } from "../src/packages/report-renderer/index.js";

// "What was done" only looks back this far, mirroring the regular report's weekly window — an
// achievement email is about the recent push that closed the gap, not the KPI's whole history.
const WHAT_WAS_DONE_WINDOW_DAYS = 7;

const achievedKpiId = process.env.ACHIEVED_KPI_ID;
if (!achievedKpiId) throw new Error("Missing ACHIEVED_KPI_ID in environment.");

const recipient = process.env.REPORT_RECIPIENT_EMAIL;
if (!recipient) throw new Error("Missing REPORT_RECIPIENT_EMAIL in environment.");

const dashboardUrl = process.env.DASHBOARD_URL ?? "https://kpi-tracker.example/dashboard";

const drive = createGoogleApiDriveClient(createDriveAuthFromEnv());
const kpiStorage = createKpiStorage(drive);
const achievementStorage = createAchievementStorage(drive);

const [achievedKpi, allKpis, achievements] = await Promise.all([
  kpiStorage.load(achievedKpiId),
  kpiStorage.list(),
  achievementStorage.list(),
]);

if (!achievedKpi) throw new Error(`No KPI found in storage for id: ${achievedKpiId}`);

const since = new Date(Date.now() - WHAT_WAS_DONE_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
const report = buildAchievementReportData({ achievedKpi, allKpis, achievements, since });
const html = renderAchievementReportEmail(report, { dashboardUrl });
const subject = achievementReportSubject(report);

const gmailClient = createGoogleApiGmailClient(createGmailAuthFromEnv());
await gmailClient.send({ to: recipient, subject, html });

console.log(`OK: sent achievement report for "${report.achievedKpi.kpiName}" to ${recipient}.`);
