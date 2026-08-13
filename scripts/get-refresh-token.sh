#!/usr/bin/env bash
# Standalone: get ONLY the Google Drive refresh token, skipping every other stage.
# Assumes GOOGLE_DRIVE_CLIENT_ID / GOOGLE_DRIVE_CLIENT_SECRET are already in .env.
set -euo pipefail

ENV_FILE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.env"

if [[ -t 1 ]] && command -v tput >/dev/null 2>&1 && [[ "$(tput colors 2>/dev/null || echo 0)" -ge 8 ]]; then
  BOLD=$(tput bold); DIM=$(tput dim); RESET=$(tput sgr0); GREEN=$(tput setaf 2); BLUE=$(tput setaf 4)
else
  BOLD=""; DIM=""; RESET=""; GREEN=""; BLUE=""
fi

open_url() {
  local url="$1"
  printf '  %s↗ opening%s %s\n' "$GREEN" "$RESET" "$url"
  { if   command -v wslview     >/dev/null 2>&1; then wslview "$url"
    elif command -v explorer.exe >/dev/null 2>&1; then explorer.exe "$url"
    elif command -v xdg-open    >/dev/null 2>&1; then xdg-open "$url"
    elif command -v open        >/dev/null 2>&1; then open "$url"
    else printf '  could not open a browser — visit it manually: %s\n' "$url"; fi
  } >/dev/null 2>&1 || printf '  could not open a browser — visit it manually: %s\n' "$url"
}

CLIENT_ID=$(grep '^GOOGLE_DRIVE_CLIENT_ID=' "$ENV_FILE" 2>/dev/null | cut -d= -f2- || true)
CLIENT_SECRET=$(grep '^GOOGLE_DRIVE_CLIENT_SECRET=' "$ENV_FILE" 2>/dev/null | cut -d= -f2- || true)

if [[ -z "$CLIENT_ID" || -z "$CLIENT_SECRET" ]]; then
  echo "GOOGLE_DRIVE_CLIENT_ID or GOOGLE_DRIVE_CLIENT_SECRET is missing from $ENV_FILE — run setup-google-drive-credentials.sh first."
  exit 1
fi

printf '\n%s%sGet the Google Drive refresh token%s\n\n' "$BOLD" "$BLUE" "$RESET"
printf '%sYour Client ID and Secret are already saved — you will need to paste them\n' "$DIM"
printf 'into the Playground below, then come back here with only the refresh token.%s\n\n' "$RESET"

echo "Client ID:     $CLIENT_ID"
echo "Client Secret: $CLIENT_SECRET"
echo

open_url "https://developers.google.com/oauthplayground/"

cat <<'EOF'
  1. Click the gear icon (top right) -> check "Use your own OAuth credentials".
  2. Paste the Client ID and Client Secret shown above -> close settings.
  3. In "Input your own scopes", paste: https://www.googleapis.com/auth/drive
  4. Click "Authorize APIs", sign in with the Google account you added as a test user.
  5. If you see "Google hasn't verified this app": Advanced -> "Go to KPI Tracker (unsafe)" -> Allow.
  6. Back in the Playground, click "Exchange authorization code for tokens" (Step 2).
  7. A "Refresh token" field appears there.

EOF

printf '%sPaste the refresh token:%s ' "$BOLD" "$RESET"
read -r REFRESH_TOKEN

if [[ -z "$REFRESH_TOKEN" ]]; then
  echo "Nothing entered — nothing saved. Run this script again when you have it."
  exit 1
fi

tmp=$(mktemp)
grep -vE '^GOOGLE_DRIVE_REFRESH_TOKEN=' "$ENV_FILE" > "$tmp" || true
printf 'GOOGLE_DRIVE_REFRESH_TOKEN=%s\n' "$REFRESH_TOKEN" >> "$tmp"
mv "$tmp" "$ENV_FILE"

printf '\n%s✓ saved%s GOOGLE_DRIVE_REFRESH_TOKEN to %s\n\n' "$GREEN" "$RESET" "$ENV_FILE"
