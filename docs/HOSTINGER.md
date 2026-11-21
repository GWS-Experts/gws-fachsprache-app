# Live-Betrieb auf dem Hostinger-VPS (KVM 2)

Die App läuft unter **https://training.gws-transfer-visa.com** auf demselben VPS wie das Visa-Portal.

| | Trainings-App | Visa-Portal (nicht anfassen) |
| --- | --- | --- |
| Ordner | `/var/www/gws` | eigener Ordner |
| pm2-Prozess | `gws`, Port 3010 | eigener Prozess, Port 3000 |
| Nginx-Site | `/etc/nginx/sites-available/gws` | `gws-visa` |

**Updates einspielen:** passiert automatisch. Sobald ein Pull Request auf `main` gemergt ist, prüft GitHub
den Code und stellt ihn live (Dauer etwa 5 Minuten). Per Knopfdruck geht es auch: GitHub → **Actions** →
**Live stellen** → **Run workflow**. Einrichtung siehe Abschnitt 0.

Von Hand im Hostinger-Browser-Terminal geht es weiterhin:

```bash
bash /var/www/gws/scripts/deploy.sh
```

Das Skript holt die neueste Version, baut die App und startet den pm2-Prozess `gws` mit den Werten
aus `/var/www/gws/.env.local` neu. Die App läuft aus dem Ordner `/var/www/gws/.live`. Schlägt der Build
fehl, bleibt die bisherige Version online. Antwortet die neue Version nach dem Start nicht, holt das
Skript automatisch die vorige zurück.

**Zurück zur vorigen Version:** GitHub → Actions → Live stellen → Run workflow → „Zurück zur vorigen
Version“, oder im Terminal `bash /var/www/gws/scripts/deploy.sh --rollback`.

## 0. Automatisch live stellen (einmalig einrichten)

GitHub meldet sich dafür mit einem eigenen SSH-Schlüssel beim Server an. Dieser Schlüssel darf auf dem
Server nur `scripts/deploy.sh` starten, sonst nichts (kein Terminal, kein Zugriff auf das Visa-Portal).

1. Im Hostinger-Browser-Terminal (einmal, nach dem Merge dieser Änderung):

   ```bash
   cd /var/www/gws && git pull && bash scripts/setup-auto-deploy.sh
   ```

2. Das Skript zeigt einen Block zwischen `-----BEGIN OPENSSH PRIVATE KEY-----` und
   `-----END OPENSSH PRIVATE KEY-----`. Diesen Block inklusive beider Zeilen markieren und kopieren.
3. GitHub → Repository `gws-fachsprache-app` → **Settings** → **Secrets and variables** → **Actions** →
   **New repository secret**. Name: `DEPLOY_SSH_KEY`, Secret: Block einfügen → **Add secret**.
4. Zurück im Terminal Enter drücken. Der geheime Schlüssel wird vom Server gelöscht.
5. Test: GitHub → **Actions** → **Live stellen** → **Run workflow** → grüner Haken = fertig.

Schlüssel tauschen (z. B. wenn er versehentlich weitergegeben wurde): Schritte 1 bis 4 wiederholen und
in Schritt 3 das vorhandene Secret `DEPLOY_SSH_KEY` mit **Update** überschreiben. Der alte Schlüssel
funktioniert danach nicht mehr.

## 1. Umgebungsvariablen (`/var/www/gws/.env.local`)

| Variable | Wert | Wo zu finden | Geheim? |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ujolqpknyltgrtkxdohr.supabase.co` | Project Settings → Data API | nein |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` | Project Settings → API Keys → Publishable key | nein |
| `SUPABASE_SECRET_KEY` | `sb_secret_…` | Project Settings → API Keys → Secret keys | **ja**, nur auf dem Server |
| `NEXT_PUBLIC_SITE_URL` | `https://training.gws-transfer-visa.com` | ohne `/` am Ende | nein |
| `SMTP_HOST` | `smtp.hostinger.com` | Hostinger → E-Mails → Konfiguration | nein |
| `SMTP_PORT` | `465` | dito | nein |
| `SMTP_USER` | das Postfach, das E-Mails verschickt | dito | nein |
| `SMTP_PASSWORD` | Passwort dieses Postfachs | dito | **ja** |
| `SMTP_FROM` | leer lassen oder `"GWS Fachsprache <dieselbe Adresse wie SMTP_USER>"` | Absenderzeile | nein |
| `STAFF_NOTIFY_EMAIL` | GWS-Postfach | bekommt Hinweise auf neue Kundennachrichten | nein |
| `ANTHROPIC_API_KEY` | `sk-ant-…` | platform.claude.com → Settings → API Keys | **ja**, nur auf dem Server |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | erzeugt `npm run push:setup` (Abschnitt 7) | nicht von Hand eintragen | privater Schlüssel **ja** |
| `VAPID_SUBJECT` | optional, z. B. `mailto:noreply@gws-transfer-visa.com` | Kontakt für die Push-Dienste | nein |

Wichtig: Variablen mit `NEXT_PUBLIC_` werden beim **Build** in die App übernommen. Nach jeder Änderung
an `.env.local` daher neu live stellen (GitHub → Actions → Live stellen → Run workflow, oder
`bash /var/www/gws/scripts/deploy.sh`).

**E-Mail-Versand testen:**

```bash
cd /var/www/gws && npm run mail:test -- deine@adresse.de
```

Das zeigt, welche Werte fehlen, meldet sich beim Mailserver an und schickt eine Test-E-Mail.

Ohne die SMTP-Werte funktioniert die App trotzdem: Einladungslinks werden dann im GWS-Bereich zum
Kopieren angezeigt, und es werden keine Benachrichtigungen verschickt.

Ohne `ANTHROPIC_API_KEY` funktioniert die App ebenfalls, nur ohne KI-Korrekturvorschläge für
Schreibabgaben. Der Schlüssel wird nicht beim Build gebraucht, nach dem Eintragen reicht
`pm2 restart gws`.

## 2. Supabase einmalig einstellen

1. **Data API:** Project Settings → Data API → Exposed schemas → `fsp` hinzufügen.
2. **Auth URL:** Authentication → URL Configuration → bei *Redirect URLs* `https://training.gws-transfer-visa.com/**` ergänzen.
   Die *Site URL* und die vorhandenen Redirect URLs gehören dem Visa-Portal und bleiben unverändert.
   (Einladungen und Passwort-Links verschickt die App selbst per SMTP. Die Redirect URL braucht nur die
   Bestätigung, wenn ein Nutzer seine E-Mail-Adresse ändert.)

> Die folgenden Abschnitte beschreiben die erste Einrichtung. Sie ist erledigt; Pfade und Namen dort
> sind die ursprüngliche Vorlage.

## 3. Server einrichten (einmalig, per SSH)

```bash
# Node.js 22 und Nginx installieren
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs nginx git
sudo npm install -g pm2

# Code holen
sudo mkdir -p /var/www && cd /var/www
sudo git clone https://github.com/GWS-Experts/gws-fachsprache-app.git
sudo chown -R $USER:$USER gws-fachsprache-app && cd gws-fachsprache-app

# Umgebungsvariablen eintragen (Tabelle oben)
nano .env.production.local

# Bauen
npm ci
npm run build
cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/

# Starten (liest die Umgebungsvariablen aus der Datei) und beim Neustart automatisch starten
PORT=3000 HOSTNAME=127.0.0.1 pm2 start .next/standalone/server.js --name gws-fachsprache \
  --node-args="--env-file=/var/www/gws-fachsprache-app/.env.production.local"
pm2 save && pm2 startup
```

## 4. Nginx und HTTPS

`/etc/nginx/sites-available/gws-fachsprache`:

```nginx
server {
    server_name gws-talent-transfer.com www.gws-talent-transfer.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/gws-fachsprache /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d gws-talent-transfer.com -d www.gws-talent-transfer.com
```

Im Hostinger-DNS müssen die A-Records von `gws-talent-transfer.com` und `www` auf die IP des VPS zeigen.

## 5. Updates einspielen

```bash
cd /var/www/gws-fachsprache-app
git pull
npm ci && npm run build
cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/
pm2 restart gws-fachsprache
```

## 6. Lern-Erinnerungen per E-Mail (Lernplan)

Kunden können unter „Lernen → Mein Lernplan“ ein Tagesziel und eine Uhrzeit für die Erinnerung festlegen.
Der Server prüft alle 15 Minuten, wer heute noch nicht genug gelernt hat, und schickt höchstens eine E-Mail pro Tag.
Voraussetzung: SMTP-Werte und `SUPABASE_SECRET_KEY` sind in `.env.local` eingetragen.

```bash
cd /var/www/gws
# 1. Geheimes Passwort erzeugen und in .env.local eintragen
echo "CRON_SECRET=$(openssl rand -hex 32)" >> .env.local
bash scripts/deploy.sh

# 2. Aufruf alle 15 Minuten einrichten (liest das Passwort aus .env.local)
(crontab -l 2>/dev/null; echo '*/15 * * * * cd /var/www/gws && curl -fsS -H "Authorization: Bearer $(grep ^CRON_SECRET= .env.local | cut -d= -f2)" http://127.0.0.1:3010/api/cron/study-reminders > /dev/null') | crontab -

# 3. Testen: zeigt z. B. {"plans":3,"due":0,"sent":0,"pushed":0}
curl -s -H "Authorization: Bearer $(grep ^CRON_SECRET= .env.local | cut -d= -f2)" http://127.0.0.1:3010/api/cron/study-reminders
```

Kunden können im Lernplan wählen, ob sie zusätzlich zur Push-Benachrichtigung (Abschnitt 7) auch eine E-Mail bekommen.

## 7. Handy-App und Push-Benachrichtigungen

Die App ist eine installierbare Web-App (PWA): Auf Android bietet Chrome „App installieren“ an, auf dem
iPhone geht es in Safari über „Teilen → Zum Home-Bildschirm“. Die Anleitung sehen Kunden auf der
Startseite und im Profil. Dafür ist nichts einzurichten.

Push-Benachrichtigungen (Lern-Erinnerungen, Antwort von GWS, für GWS: neue Kundennachricht) brauchen einmalig ein
Schlüsselpaar:

```bash
cd /var/www/gws
npm run push:setup
pm2 restart gws
```

Danach erscheint im Profil und im Lernplan „Benachrichtigungen einschalten“. Den Schlüssel nicht neu erzeugen,
sonst müssen alle Geräte Push neu einschalten. Auf dem iPhone funktioniert Push nur in der installierten App
(iOS 16.4 oder neuer).
