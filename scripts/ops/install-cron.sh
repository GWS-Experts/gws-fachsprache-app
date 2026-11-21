#!/usr/bin/env bash
# Richtet Backup und Ausfallüberwachung auf dem VPS ein (einmalig, darf mehrfach laufen).
#   bash /var/www/gws/scripts/ops/install-cron.sh
# - Backup jede Nacht um 03:15 Uhr
# - Ausfallprüfung alle 5 Minuten
# Bestehende crontab-Einträge (z. B. Lern-Erinnerungen) bleiben erhalten.
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/gws}"
NODE="$(command -v node)"
PM2_DIR="$(dirname "$(command -v pm2 || echo /usr/bin/pm2)")"
ENV_FILE="$APP_DIR/.env.local"

if [ ! -f "$ENV_FILE" ]; then echo "FEHLER: $ENV_FILE fehlt."; exit 1; fi
if [ ! -d "$APP_DIR/node_modules/@supabase/supabase-js" ]; then echo "FEHLER: Pakete fehlen. Bitte zuerst: bash scripts/deploy.sh"; exit 1; fi

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

RUN="cd $APP_DIR && PATH=$PM2_DIR:\$PATH $NODE --env-file=$ENV_FILE"
BACKUP_LINE="15 3 * * * $RUN scripts/ops/backup.mjs >> $BACKUP_DIR/backup.log 2>&1 # gws-backup"
WATCH_LINE="*/5 * * * * $RUN scripts/ops/watchdog.mjs >> $BACKUP_DIR/watchdog.log 2>&1 # gws-watchdog"

# Alte Einträge dieser beiden Aufgaben entfernen, neue anhängen
( crontab -l 2>/dev/null | grep -v -e '# gws-backup$' -e '# gws-watchdog$' || true
  echo "$BACKUP_LINE"
  echo "$WATCH_LINE" ) | crontab -

# Logdateien klein halten
cat > /etc/logrotate.d/gws-ops <<ROT
$BACKUP_DIR/*.log {
  weekly
  rotate 8
  compress
  missingok
  notifempty
}
ROT

echo "OK: crontab eingerichtet. Aktuelle Einträge:"
crontab -l
