# Live-Betrieb auf dem Hostinger-VPS (KVM 2)

Die App läuft als Node.js-Server hinter einem Nginx-Reverse-Proxy unter **https://gws-talent-transfer.com**.

## 1. Umgebungsvariablen

Diese Werte trägst du auf dem VPS ein (Datei `/var/www/gws-fachsprache-app/.env.production.local`
oder in der Konfiguration deines Prozessmanagers, siehe unten). Die Supabase-Werte findest du im
Supabase-Dashboard, Projekt **GWS**.

| Variable | Wert | Wo zu finden | Geheim? |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ujolqpknyltgrtkxdohr.supabase.co` | Project Settings → Data API | nein |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` | Project Settings → API Keys → Publishable key | nein |
| `SUPABASE_SECRET_KEY` | `sb_secret_…` | Project Settings → API Keys → Secret keys | **ja**, nur auf dem Server |
| `NEXT_PUBLIC_SITE_URL` | `https://gws-talent-transfer.com` | deine Domain, ohne `/` am Ende | nein |
| `SMTP_HOST` | z. B. `smtp.hostinger.com` | Hostinger → E-Mails → Konfiguration | nein |
| `SMTP_PORT` | `465` | dito | nein |
| `SMTP_USER` | z. B. `noreply@gws-talent-transfer.com` | das Postfach, das E-Mails verschickt | nein |
| `SMTP_PASSWORD` | Passwort dieses Postfachs | dito | **ja** |
| `SMTP_FROM` | `GWS Fachsprache <noreply@gws-talent-transfer.com>` | Absenderzeile | nein |
| `STAFF_NOTIFY_EMAIL` | z. B. `fachsprache@gws-transfer.com` | Postfach für Hinweise auf neue Kundennachrichten | nein |

Wichtig: Variablen mit `NEXT_PUBLIC_` werden beim **Build** in die App übernommen. Nach einer Änderung
musst du `npm run build` erneut ausführen.

Ohne die SMTP-Werte funktioniert die App trotzdem: Einladungslinks werden dann im GWS-Bereich zum
Kopieren angezeigt, und es werden keine Benachrichtigungen verschickt.

## 2. Supabase einmalig einstellen

1. **Data API:** Project Settings → Data API → Exposed schemas → `fsp` hinzufügen.
2. **Auth URL:** Authentication → URL Configuration → bei *Redirect URLs* `https://gws-talent-transfer.com/**` ergänzen
   (die *Site URL* des Visa-Portals bleibt unverändert).

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
