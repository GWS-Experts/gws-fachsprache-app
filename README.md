# GWS Fachsprache Pflege – Trainings-App

Trainings-App der GWS talent transfer GmbH für die Vorbereitung auf die Fachsprachprüfung Pflege (B2).
Next.js 16 (App Router) mit Supabase für Login, Datenbank, Speicher und Zugriffsregeln.

## Funktionen

- **Kunden (Pflegekräfte):** Lernmodule mit sieben Übungstypen (Lesen, Hören, Vokabeln, Quiz, Dialog, Schreiben, Sprechen),
  eigenes Fortschritts-Dashboard, Nachrichten an GWS (auch mit Bezug auf eine Lektion), Profilseite.
- **GWS-Mitarbeiter:** Kundenübersicht (Vorname, Nachname, E-Mail, Fortschritt), Dashboard pro Kunde,
  Posteingang mit Antworten, Feedback zu Schreib- und Sprechabgaben, Inhaltseditor für Module und Lektionen,
  Einladung neuer Kunden und Kollegen per E-Mail.
- **Probeprüfung:** kompletter Durchlauf (Lesen, Sprachbausteine, Hören, Schreiben, Sprechen) mit Zeitlimit pro Teil,
  begrenzten Hördurchgängen und Auswertung nach Bereichen; Schreiben und Sprechen bewertet GWS unter „Prüfungen“.
- Oberfläche auf Deutsch und Englisch umschaltbar, die Wahl wird im Profil gespeichert.
- Hörtexte und Dialoge haben fertige Audiodateien mit verschiedenen Stimmen (`public/audio`). Ohne Audiodatei liest
  die Sprachausgabe des Browsers vor, bei Dialogen mit wechselnden Stimmen.

## Datenbank

Alle Tabellen liegen im Schema `fsp` des Supabase-Projekts **GWS**, getrennt vom Visa-Portal (Schema `public`).
Die Logins (Supabase Auth) teilen sich beide Apps; Zugang zur Trainings-App hat nur, wer ein Profil in `fsp.profiles` hat.

- `supabase/migrations/` – Tabellen, Row Level Security, Trigger, Storage-Buckets
- `supabase/seed/fsp_beispielinhalte.sql` – 3 Beispielmodule mit 15 Lektionen
- `supabase/seed/fsp_neue_module.sql` – 5 weitere Module (Schichtübergabe, Pflegedokumentation, Telefonat mit dem Arzt,
  Angehörigengespräch, Pflegebericht) mit 30 Lektionen
- `supabase/seed/fsp_probepruefung.sql` – Probeprüfung 1 mit 10 Teilen (benötigt Migration `20261120220000_fsp_exams.sql`)
- `supabase/seed/fsp_audio_beispielinhalte.sql` – verknüpft die Beispiellektionen mit den fertigen Audiodateien
- `supabase/seed/fsp_fachbegriffe.sql` – Fachwortschatz Pflege (698 Begriffe in 21 Themen) für Glossar und Vokabeltrainer; Quelle: `supabase/seed/fachbegriffe/*.txt`, neu erzeugen mit `node scripts/build-fachbegriffe-seed.mjs supabase/seed/fachbegriffe supabase/seed/fsp_fachbegriffe.sql`

Jede Tabelle hat RLS: Kunden sehen nur ihre eigenen Profile, Ergebnisse, Abgaben und Nachrichten; GWS-Mitarbeiter
(`role = 'staff'`) sehen alles. Die Rolle kann ein Kunde nicht selbst ändern.

**Wichtig:** Das Schema `fsp` muss im Supabase-Dashboard freigegeben sein:
Project Settings → Data API → Exposed schemas → `fsp` ergänzen.

### Probeprüfungen

Eine Prüfung (`fsp.exams`) gehört zu einem eigenen, unveröffentlichten Modul; dessen Lektionen sind die Prüfungsteile
(in ihrer Reihenfolge). Zeitlimit (`time_minutes`), Hördurchgänge (`max_plays`) und Punkte für Schreiben/Sprechen
(`max_points`) stehen im Inhalt der Lektion und lassen sich im Inhaltseditor einstellen. Durchgänge liegen in
`fsp.exam_attempts`; Schreib- und Sprechabgaben landen zusätzlich als normale Abgaben bei GWS.

### Audiodateien neu erzeugen

`python3 scripts/generate-audio.py --voices <ordner>` erzeugt für jede Lektion mit `"audio_path": "/audio/…"`
eine MP3-Datei mit der freien Offline-Sprachausgabe Piper (Stimmen thorsten, kerstin, ramona, karlsson).
Details und Voraussetzungen stehen oben im Skript.

## Lokal starten

```bash
cp .env.example .env.local   # Werte eintragen
npm install
npm run dev                  # http://localhost:3000
```

`.env.local` wird nicht zu GitHub hochgeladen.

## Live-Betrieb auf dem Hostinger-VPS

Siehe [docs/HOSTINGER.md](docs/HOSTINGER.md).
