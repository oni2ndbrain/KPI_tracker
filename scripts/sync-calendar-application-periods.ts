import { createGoogleApiCalendarClient, createCalendarAuthFromEnv } from "../src/packages/calendar/google-calendar.js";
import { createDriveAuthFromEnv, createGoogleApiDriveClient } from "../src/packages/kpi-storage/google-drive.js";
import { createTargetCompanyStorage } from "../src/packages/kpi-storage/index.js";
import { matchApplicationPeriods } from "../src/packages/target-company/index.js";

const drive = createGoogleApiDriveClient(createDriveAuthFromEnv());
const targetCompanyStorage = createTargetCompanyStorage(drive);
const calendarClient = createGoogleApiCalendarClient(createCalendarAuthFromEnv());

const companies = await targetCompanyStorage.list();
const events = await calendarClient.listEvents();
const matches = matchApplicationPeriods(events, companies);

let updated = 0;
for (const company of companies) {
  const applicationPeriod = matches.get(company.id) ?? null;
  const unchanged =
    company.applicationPeriod?.start === applicationPeriod?.start &&
    company.applicationPeriod?.end === applicationPeriod?.end;
  if (unchanged) continue;

  await targetCompanyStorage.save({ ...company, applicationPeriod });
  updated++;
}

console.log(`OK: synced application periods for ${updated} target compan${updated === 1 ? "y" : "ies"} (checked ${companies.length}).`);
