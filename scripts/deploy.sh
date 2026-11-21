#!/usr/bin/env bash
# Spielt die neueste Version auf dem Hostinger-VPS ein und startet die App neu.
#
# Aufruf auf dem Server:  bash /var/www/gws/scripts/deploy.sh
# Automatisch: GitHub Actions ruft dieses Skript nach jedem Merge auf main per SSH auf
# (siehe .github/workflows/deploy.yml und docs/HOSTINGER.md, Abschnitt "Automatisch live stellen").
#
# Ablauf:
#   1. neueste Version holen (git pull)
#   2. Pakete installieren und App bauen
#   3. fertigen Build nach .live/ kopieren und die App von dort neu starten
#   4. prüfen, ob die App antwortet; wenn nicht, automatisch die vorige Version zurückholen
#
# Schlägt der Build fehl, läuft die bisherige Version unverändert weiter, weil die App aus .live/
# läuft und nicht aus .next/.
#
# Liest alle Einstellungen (Supabase, SMTP, NEXT_PUBLIC_SITE_URL) aus .env.local im App-Ordner,
# beim Bauen und beim Start. Das Visa-Portal (anderer pm2-Prozess, Port 3000) wird nicht angefasst.
#
# Zurück zur vorigen Version (ohne neu zu bauen):  bash /var/www/gws/scripts/deploy.sh --rollback
# Einmalige Einrichtung des automatischen Live-Stellens:  bash /var/www/gws/scripts/setup-auto-deploy.sh

# Alles steckt in main(), damit Bash das ganze Skript einliest, bevor git pull diese Datei ändert.
main() {
  set -euo pipefail

  local APP_DIR ENV_FILE LIVE PREV NEW
  APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  APP_NAME="${APP_NAME:-gws}"   # pm2-Name der Trainings-App (Visa-Portal heißt anders)
  APP_PORT="${APP_PORT:-3010}"  # Port der Trainings-App (Visa-Portal: 3000)
  ENV_FILE="$APP_DIR/.env.local"
  LIVE="$APP_DIR/.live"
  PREV="$APP_DIR/.live.prev"
  NEW="$APP_DIR/.live.new"

  cd "$APP_DIR"
  if [ ! -f "$ENV_FILE" ]; then
    echo "FEHLER: $ENV_FILE fehlt. Bitte zuerst anlegen (Vorlage: .env.example)."
    exit 1
  fi

  # Aufruf von GitHub Actions über den eingeschränkten SSH-Schlüssel: Der Schlüssel darf nur dieses
  # Skript starten; GitHub sagt über den SSH-Befehl, ob live gestellt oder zurückgerollt wird.
  if [ "${1:-}" = "--ssh" ]; then
    case "${SSH_ORIGINAL_COMMAND:-}" in
      rollback) set -- --rollback ;;
      *) set -- ;;
    esac
  fi

  if [ "${1:-}" = "--rollback" ]; then
    rollback "$LIVE" "$PREV" "$APP_NAME" "$APP_PORT" "$ENV_FILE"
    exit 0
  fi

  if [ "${1:-}" != "--nach-pull" ]; then
    # Nur ein Update gleichzeitig (z. B. zwei Merges kurz hintereinander).
    exec 9>/tmp/gws-deploy.lock
    if ! flock -w 900 9; then
      echo "FEHLER: Ein anderes Update läuft seit über 15 Minuten. Bitte später erneut versuchen."
      exit 1
    fi

    echo "==> Neueste Version holen"
    git pull --ff-only
    echo "    Stand: $(git log -1 --format='%h %s')"
    # Mit der eben geholten Fassung dieses Skripts weitermachen (die Sperre bleibt bestehen).
    exec bash "$APP_DIR/scripts/deploy.sh" --nach-pull
  fi

  echo "==> Pakete installieren"
  npm ci --no-audit --no-fund

  echo "==> App bauen"
  npm run build

  echo "==> Neue Version bereitlegen"
  rm -rf "$NEW"
  mkdir -p "$NEW/.next"
  cp -a .next/standalone/. "$NEW/"
  cp -r public "$NEW/"
  cp -r .next/static "$NEW/.next/static"

  rm -rf "$PREV"
  if [ -d "$LIVE" ]; then
    mv "$LIVE" "$PREV"
  fi
  mv "$NEW" "$LIVE"

  echo "==> App neu starten ($APP_NAME auf Port $APP_PORT)"
  start_app "$LIVE" "$APP_NAME" "$APP_PORT" "$ENV_FILE"

  echo "==> Prüfen, ob die App antwortet"
  if check_app "$APP_PORT"; then
    pm2 save
    echo "==> Fertig. Die neue Version ist live."
    return 0
  fi

  echo "FEHLER: Die neue Version antwortet nicht. Letzte Log-Zeilen:"
  pm2 logs "$APP_NAME" --lines 30 --nostream || true
  if [ -d "$PREV" ]; then
    echo "==> Vorige Version wird wiederhergestellt"
    rm -rf "$NEW"
    mv "$LIVE" "$NEW"
    mv "$PREV" "$LIVE"
    start_app "$LIVE" "$APP_NAME" "$APP_PORT" "$ENV_FILE"
    if check_app "$APP_PORT"; then
      pm2 save
      echo "==> Die vorige Version läuft wieder. Das Update wurde NICHT übernommen."
    else
      echo "FEHLER: Auch die vorige Version antwortet nicht. Bitte pm2 logs $APP_NAME ansehen."
    fi
  fi
  exit 1
}

# pm2 (und der pm2-Hintergrunddienst, falls er dabei startet) darf die Update-Sperre nicht erben,
# sonst bliebe sie für immer belegt.
pm2() {
  command pm2 "$@" 9>&-
}

start_app() {
  local dir="$1" name="$2" port="$3" env_file="$4"
  pm2 delete "$name" >/dev/null 2>&1 || true
  PORT="$port" HOSTNAME=127.0.0.1 pm2 start "$dir/server.js" \
    --name "$name" --cwd "$dir" --node-args="--env-file=$env_file"
}

# Wartet bis zu 60 Sekunden auf eine Antwort der App (jede Antwort unter 500 zählt).
check_app() {
  local port="$1" code i
  for i in $(seq 1 30); do
    code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$port/" || true)"
    if [ "$code" != "000" ] && [ "$code" -lt 500 ]; then
      echo "    App antwortet (HTTP $code)."
      return 0
    fi
    sleep 2
  done
  return 1
}

rollback() {
  local live="$1" prev="$2" name="$3" port="$4" env_file="$5" tmp
  if [ ! -d "$prev" ]; then
    echo "FEHLER: Es gibt keine vorige Version ($prev fehlt)."
    exit 1
  fi
  echo "==> Zur vorigen Version wechseln"
  tmp="$live.tausch"
  rm -rf "$tmp"
  mv "$live" "$tmp"
  mv "$prev" "$live"
  mv "$tmp" "$prev"
  start_app "$live" "$name" "$port" "$env_file"
  if check_app "$port"; then
    pm2 save
    echo "==> Fertig. Die vorige Version läuft. (Noch einmal --rollback holt die neuere zurück.)"
  else
    echo "FEHLER: Die vorige Version antwortet nicht. Bitte pm2 logs $name ansehen."
    exit 1
  fi
}

main "$@"; exit $?
