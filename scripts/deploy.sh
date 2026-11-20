#!/usr/bin/env bash
# Spielt die neueste Version auf dem Hostinger-VPS ein und startet die App neu.
# Aufruf auf dem Server:  bash /var/www/gws/scripts/deploy.sh
#
# Liest alle Einstellungen (Supabase, SMTP, NEXT_PUBLIC_SITE_URL) aus .env.local
# im App-Ordner, beim Bauen und beim Start. Das Visa-Portal (anderer pm2-Prozess,
# Port 3000) wird nicht angefasst.
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_NAME="${APP_NAME:-gws}"
APP_PORT="${APP_PORT:-3010}"
ENV_FILE="$APP_DIR/.env.local"

cd "$APP_DIR"
if [ ! -f "$ENV_FILE" ]; then
  echo "FEHLER: $ENV_FILE fehlt. Bitte zuerst anlegen (Vorlage: .env.example)."
  exit 1
fi

echo "==> Neueste Version holen"
git pull --ff-only

echo "==> Pakete installieren"
npm ci --no-audit --no-fund

echo "==> App bauen"
npm run build
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/

echo "==> App neu starten ($APP_NAME auf Port $APP_PORT)"
pm2 delete "$APP_NAME" >/dev/null 2>&1 || true
PORT="$APP_PORT" HOSTNAME=127.0.0.1 pm2 start .next/standalone/server.js \
  --name "$APP_NAME" --node-args="--env-file=$ENV_FILE"
pm2 save

echo "==> Fertig. Die App läuft wieder."
