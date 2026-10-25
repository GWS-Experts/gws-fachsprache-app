# GWS Fachsprache Pflege – Trainings-App

Trainings-App der GWS talent transfer GmbH für die Vorbereitung auf die Fachsprachprüfung Pflege (B2).
Next.js 16 (App Router) mit Supabase für Login, Datenbank, Speicher und Zugriffsregeln.

## Funktionen

- **Kunden (Pflegekräfte):** Lernmodule mit sieben Übungstypen (Lesen, Hören, Vokabeln, Quiz, Dialog, Schreiben, Sprechen),
  eigenes Fortschritts-Dashboard, Nachrichten an GWS (auch mit Bezug auf eine Lektion), Profilseite.
- **GWS-Mitarbeiter:** Kundenübersicht (Vorname, Nachname, E-Mail, Fortschritt), Dashboard pro Kunde,
  Posteingang mit Antworten, Feedback zu Schreib- und Sprechabgaben, Inhaltseditor für Module und Lektionen,
  Einladung neuer Kunden und Kollegen per E-Mail.
- Oberfläche auf Deutsch und Englisch umschaltbar, die Wahl wird im Profil gespeichert.
- Hören und Dialoge nutzen die Sprachausgabe des Browsers, solange keine Audiodatei hochgeladen ist.

## Datenbank

Alle Tabellen liegen im Schema `fsp` des Supabase-Projekts **GWS**, getrennt vom Visa-Portal (Schema `public`).
Die Logins (Supabase Auth) teilen sich beide Apps; Zugang zur Trainings-App hat nur, wer ein Profil in `fsp.profiles` hat.

- `supabase/migrations/` – Tabellen, Row Level Security, Trigger, Storage-Buckets
- `supabase/seed/fsp_beispielinhalte.sql` – 3 Beispielmodule mit 15 Lektionen

Jede Tabelle hat RLS: Kunden sehen nur ihre eigenen Profile, Ergebnisse, Abgaben und Nachrichten; GWS-Mitarbeiter
(`role = 'staff'`) sehen alles. Die Rolle kann ein Kunde nicht selbst ändern.

**Wichtig:** Das Schema `fsp` muss im Supabase-Dashboard freigegeben sein:
Project Settings → Data API → Exposed schemas → `fsp` ergänzen.

## Lokal starten

```bash
cp .env.example .env.local   # Werte eintragen
npm install
npm run dev                  # http://localhost:3000
```

`.env.local` wird nicht zu GitHub hochgeladen.

## Live-Betrieb auf dem Hostinger-VPS

Siehe [docs/HOSTINGER.md](docs/HOSTINGER.md).
