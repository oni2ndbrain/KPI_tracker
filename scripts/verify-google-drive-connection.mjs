import { auth, drive } from "@googleapis/drive";

const { GOOGLE_DRIVE_CLIENT_ID, GOOGLE_DRIVE_CLIENT_SECRET, GOOGLE_DRIVE_REFRESH_TOKEN } = process.env;

if (!GOOGLE_DRIVE_CLIENT_ID || !GOOGLE_DRIVE_CLIENT_SECRET || !GOOGLE_DRIVE_REFRESH_TOKEN) {
  console.error("Missing Google Drive credentials in the environment.");
  process.exit(1);
}

const client = new auth.OAuth2(GOOGLE_DRIVE_CLIENT_ID, GOOGLE_DRIVE_CLIENT_SECRET);
client.setCredentials({ refresh_token: GOOGLE_DRIVE_REFRESH_TOKEN });

const driveClient = drive({ version: "v3", auth: client });

const response = await driveClient.files.list({
  q: "name = 'KPI_tracker' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
  fields: "files(id, name)",
});

const folder = response.data.files?.[0];
if (folder) {
  console.log(`OK: connected, found existing "KPI_tracker" folder (id: ${folder.id}).`);
} else {
  console.log('OK: connected, no "KPI_tracker" folder yet — it will be created on first save.');
}
