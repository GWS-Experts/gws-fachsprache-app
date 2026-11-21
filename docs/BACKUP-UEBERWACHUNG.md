# Backups und Ausfallüberwachung

Diese Anleitung richtet auf dem Hostinger-VPS zwei Dinge ein:

1. **Tägliches Backup** (jede Nacht um 03:15 Uhr): alle Daten der Trainings-App (Schema `fsp`:
   Kunden, Lektionen, Fortschritt, Abgaben, Nachrichten, Prüfungen …) und alle Dateien
   (Sprachaufnahmen, Hör-Audios, Bilder). Abgelegt in `/var/backups/gws`, die letzten 30 Tage bleiben.
2. **Ausfallüberwachung** (alle 5 Minuten): Ist die App nicht erreichbar, wird sie automatisch neu
   gestartet. Ist sie nach ca. 10 Minuten immer noch weg, kommt eine E-Mail. Sobald sie wieder läuft,
   kommt eine Entwarnung. Einmal am Tag wird außerdem geprüft: Zertifikat bald abgelaufen?
   Festplatte fast voll? Backup älter als 30 Stunden? Dann kommt ein „Wartungshinweis“.

Das Visa-Portal wird dabei nicht angefasst.

> **Warum zusätzlich zu Supabase?** Supabase (Pro-Tarif) sichert die Datenbank zwar selbst
> 7 Tage lang. Eine Wiederherstellung dort setzt aber das **ganze** Projekt zurück, also auch das
> Visa-Portal, und Sprachaufnahmen sind nicht enthalten. Unser Backup betrifft nur die
> Trainings-App und enthält auch die Dateien.

---

## Einrichtung (einmalig, ca. 10 Minuten)

Alle Befehle in der **Hostinger-Webkonsole** eintippen (oder einfügen) und mit **Enter** bestätigen.

### Schritt 1: Neueste Version einspielen

```bash
cd /var/www/gws && git pull && bash scripts/deploy.sh
```

Warten, bis `==> Fertig. Die App läuft wieder.` erscheint.

### Schritt 2: Empfänger der Warnungen eintragen

`deine@adresse.de` durch die eigene E-Mail-Adresse ersetzen:

```bash
echo "ALERT_EMAIL=deine@adresse.de" >> /var/www/gws/.env.local
```

(Ohne `ALERT_EMAIL` gehen die Warnungen an `STAFF_NOTIFY_EMAIL`.)

### Schritt 3: Test-Warnung schicken

```bash
cd /var/www/gws && npm run ops:alert-test
```

Es muss `Test-Warnung verschickt` erscheinen. Im Postfach (auch Spam-Ordner) sollte eine E-Mail
„[GWS Training] Test der Ausfallüberwachung“ ankommen.

### Schritt 4: Erstes Backup von Hand starten

```bash
cd /var/www/gws && npm run ops:backup
```

Am Ende muss `Backup fertig.` stehen. Je nach Anzahl der Aufnahmen kann das beim ersten Mal ein
paar Minuten dauern, danach werden nur noch neue Dateien geladen.

### Schritt 5: Automatik einschalten

```bash
bash /var/www/gws/scripts/ops/install-cron.sh
```

Es erscheint `OK: crontab eingerichtet` und darunter eine Liste. Darin müssen zwei Zeilen stehen,
die mit `# gws-backup` und `# gws-watchdog` enden. Die bisherige Zeile für die Lern-Erinnerungen
bleibt erhalten.

### Schritt 6: Prüfen, ob die Überwachung läuft

```bash
curl -s https://training.gws-transfer-visa.com/api/health
```

Die Antwort muss `"ok":true` enthalten. Fertig.

---

## Zusätzlich empfohlen: Überwachung von außen (kostenlos)

Fällt der **ganze Server** aus, kann er selbst keine E-Mail mehr schicken. Dafür gibt es kostenlose
Dienste, die die App von außen prüfen, z. B. **UptimeRobot**:

1. Auf <https://uptimerobot.com> ein kostenloses Konto anlegen.
2. **New monitor** → Typ **HTTP(s)**.
3. URL: `https://training.gws-transfer-visa.com/api/health`
4. Intervall: 5 Minuten. Bei „Alert contacts“ die eigene E-Mail-Adresse auswählen.
5. Speichern.

---

## Wenn eine Ausfall-E-Mail kommt

1. Kurz warten: Oft hilft schon der automatische Neustart, dann kommt bald „App läuft wieder“.
2. Sonst in der Hostinger-Webkonsole nachsehen:
   ```bash
   pm2 status
   ```
   Steht bei `gws` nicht `online`:
   ```bash
   pm2 logs gws --lines 50
   ```
   Die letzten Zeilen an Claude schicken.
3. Neustart von Hand:
   ```bash
   pm2 restart gws
   ```
4. Steht in der E-Mail „Datenbank nicht erreichbar“, liegt es meist an Supabase:
   <https://status.supabase.com> prüfen.

## Nützliche Befehle

| Was | Befehl |
|---|---|
| Liste der Backups | `ls -lh /var/backups/gws/db` |
| Protokoll der Backups | `tail -n 20 /var/backups/gws/backup.log` |
| Protokoll der Überwachung | `tail -n 20 /var/backups/gws/watchdog.log` |
| Backup sofort starten | `cd /var/www/gws && npm run ops:backup` |

## Daten wiederherstellen (Notfall)

Am besten zusammen mit Claude. Zuerst nur **ansehen** (ändert nichts):

```bash
cd /var/www/gws && npm run ops:restore -- /var/backups/gws/db/fsp-2026-11-21.json.gz
```

Das zeigt pro Tabelle, wie viele Zeilen im Backup und jetzt in der Datenbank sind. Zurückschreiben
mit `--apply` (optional `--table messages` für nur eine Tabelle, `--storage` für fehlende
Aufnahmen und Medien). Vorhandene Zeilen werden mit dem Stand aus dem Backup überschrieben,
neuere Zeilen bleiben erhalten.

## Technik (für Entwickler)

- `src/app/api/health/route.ts`: Lebenszeichen, prüft die Datenbank (HTTP 200 oder 503).
- `scripts/ops/backup.mjs`, `restore.mjs`, `watchdog.mjs`, `alert-test.mjs`, `install-cron.sh`.
- Neue Tabelle im Schema `fsp`? In `scripts/ops/common.mjs` bei `TABLES` (und ggf. `KEYS`) ergänzen.
- Zustand der Überwachung: `/var/backups/gws/state/*.json`.
