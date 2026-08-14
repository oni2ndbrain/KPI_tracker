import { createGmailAuthFromEnv, createGoogleApiGmailClient } from "../src/packages/gmail/google-gmail.js";
import { buildRegularReportData, type ReportPeriod } from "../src/packages/kpi-engine/index.js";
import { createDriveAuthFromEnv, createGoogleApiDriveClient } from "../src/packages/kpi-storage/google-drive.js";
import { createAchievementStorage, createKpiStorage } from "../src/packages/kpi-storage/index.js";
import { regularReportSubject, renderRegularReportEmail } from "../src/packages/report-renderer/index.js";

const WINDOW_DAYS: Record<ReportPeriod, number> = { weekly: 7, monthly: 30 };

function parsePeriod(value: string | undefined): ReportPeriod {
  if (value === "weekly" || value === "monthly") return value;
  throw new Error(`REPORT_PERIOD must be "weekly" or "monthly", got: ${value ?? "(unset)"}`);
}

const period = parsePeriod(process.env.REPORT_PERIOD);

const recipient = process.env.REPORT_RECIPIENT_EMAIL;
if (!recipient) throw new Error("Missing REPORT_RECIPIENT_EMAIL in environment.");

const dashboardUrl = process.env.DASHBOARD_URL ?? "https://kpi-tracker.example/dashboard";

const drive = createGoogleApiDriveClient(createDriveAuthFromEnv());
const kpiStorage = createKpiStorage(drive);
const achievementStorage = createAchievementStorage(drive);

const [kpis, achievements] = await Promise.all([kpiStorage.list(), achievementStorage.list()]);

const since = new Date(Date.now() - WINDOW_DAYS[period] * 24 * 60 * 60 * 1000).toISOString();
const report = buildRegularReportData({ period, kpis, achievements, since });
const html = renderRegularReportEmail(report, { dashboardUrl });
const subject = regularReportSubject(report);

const gmailClient = createGoogleApiGmailClient(createGmailAuthFromEnv());
await gmailClient.send({ to: recipient, subject, html });

console.log(`OK: sent ${period} regular report to ${recipient} (${report.facts.length} KPIs, ${report.gaps.length} gaps).`);
