# Live-Betrieb auf dem Hostinger-VPS (KVM 2)

Die App läuft unter **https://training.gws-transfer-visa.com** auf demselben VPS wie das Visa-Portal.

| | Trainings-App | Visa-Portal (nicht anfassen) |
| --- | --- | --- |
| Ordner | `/var/www/gws` | eigener Ordner |
| pm2-Prozess | `gws`, Port 3010 | eigener Prozess, Port 3000 |
| Nginx-Site | `/etc/nginx/sites-available/gws` | `gws-visa` |

**Updates einspielen:** im Hostinger-Browser-Terminal

```bash
bash /var/www/gws/scripts/deploy.sh
```

Das Skript holt die neueste Version, baut die App und startet den pm2-Prozess `gws` mit den Werten
aus `/var/www/gws/.env.local` neu.

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

Wichtig: Variablen mit `NEXT_PUBLIC_` werden beim **Build** in die App übernommen. Nach jeder Änderung
an `.env.local` daher `bash /var/www/gws/scripts/deploy.sh` ausführen.

**E-Mail-Versand testen:**

```bash
cd /var/www/gws && npm run mail:test -- deine@adresse.de
```

Das zeigt, welche Werte fehlen, meldet sich beim Mailserver an und schickt eine Test-E-Mail.

Ohne die SMTP-Werte funktioniert die App trotzdem: Einladungslinks werden dann im GWS-Bereich zum
Kopieren angezeigt, und es werden keine Benachrichtigungen verschickt.

Ohne `ANTHROPIC_API_KEY` funktioniert die App ebenfalls, nur ohne KI-Korrekturvorschläge für
Schreibabgaben. Der Schlüssel wird nicht beim Build gebraucht, nach dem Eintragen reicht
`pm2 restart gws --update-env`.

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
