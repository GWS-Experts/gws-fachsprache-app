#!/usr/bin/env bash
# Einmalige Einrichtung: GitHub Actions darf die Trainings-App auf diesem Server live stellen.
#
# Aufruf auf dem Server (Hostinger-Browser-Terminal):
#   cd /var/www/gws && git pull && bash scripts/setup-auto-deploy.sh
#
# Was passiert:
#   1. Ein neuer SSH-Schlüssel nur für GitHub wird erzeugt.
#   2. Der Server erlaubt diesem Schlüssel genau EINE Sache: scripts/deploy.sh starten.
#      Kein Terminal, keine anderen Befehle, kein Zugriff auf das Visa-Portal.
#   3. Der geheime Teil des Schlüssels wird einmal angezeigt (zum Kopieren nach GitHub)
#      und danach vom Server gelöscht.
#
# Erneut ausführen ist unbedenklich: Der alte GitHub-Schlüssel wird dabei ersetzt.
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KEY="$HOME/.ssh/gws_github_deploy"
AUTH="$HOME/.ssh/authorized_keys"
MARK="gws-github-actions-deploy"

mkdir -p "$HOME/.ssh"
chmod 700 "$HOME/.ssh"
touch "$AUTH"
chmod 600 "$AUTH"

rm -f "$KEY" "$KEY.pub"
ssh-keygen -q -t ed25519 -N "" -C "$MARK" -f "$KEY"

# Alten GitHub-Schlüssel entfernen, neuen mit Einschränkung eintragen.
grep -v "$MARK" "$AUTH" > "$AUTH.tmp" || true
echo "command=\"bash $APP_DIR/scripts/deploy.sh --ssh\",restrict $(cat "$KEY.pub")" >> "$AUTH.tmp"
mv "$AUTH.tmp" "$AUTH"
chmod 600 "$AUTH"
rm -f "$KEY.pub"

if command -v sshd >/dev/null 2>&1; then
  root_login="$(sshd -T 2>/dev/null | awk '/^permitrootlogin/ {print $2}' || true)"
  if [ "$(id -u)" = "0" ] && [ "$root_login" = "no" ]; then
    echo "WARNUNG: Der Server erlaubt keine SSH-Anmeldung als root (PermitRootLogin no)."
    echo "         Bitte Claude Bescheid geben, dann suchen wir einen anderen Weg."
  fi
fi

cat <<EOF

=====================================================================
 Schritt A: Den folgenden Block komplett nach GitHub kopieren.
 Er beginnt mit -----BEGIN OPENSSH PRIVATE KEY-----
 und endet mit  -----END OPENSSH PRIVATE KEY-----  (beide Zeilen mitkopieren).

 GitHub: Repository -> Settings -> Secrets and variables -> Actions
         -> New repository secret
         Name:   DEPLOY_SSH_KEY
         Secret: den Block einfügen -> Add secret
=====================================================================

EOF
cat "$KEY"
echo
if [ "$(whoami)" != "root" ]; then
  cat <<EOF
=====================================================================
 Zusätzlich nötig, weil dieser Server-Benutzer nicht "root" heißt:
 GitHub: Settings -> Secrets and variables -> Actions -> Reiter "Variables"
         -> New repository variable
         Name:  DEPLOY_USER
         Value: $(whoami)
=====================================================================

EOF
fi

read -r -p "Wenn der Schlüssel in GitHub gespeichert ist, hier Enter drücken ... " _
shred -u "$KEY" 2>/dev/null || rm -f "$KEY"
clear 2>/dev/null || true
echo "Fertig. Der geheime Schlüssel wurde vom Server gelöscht und liegt nur noch bei GitHub."
echo "Jetzt in GitHub unter Actions -> \"Live stellen\" -> \"Run workflow\" einmal testen."
