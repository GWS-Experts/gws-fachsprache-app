// Gemeinsame Helfer für Backup und Ausfallüberwachung (laufen per crontab auf dem VPS).
// Einstellungen kommen aus .env.local (Aufruf mit node --env-file=.env.local).
import fs from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";

export const env = process.env;
export const APP_DIR = path.resolve(import.meta.dirname, "../..");
export const BACKUP_DIR = env.BACKUP_DIR || "/var/backups/gws";
export const STATE_DIR = env.OPS_STATE_DIR || path.join(BACKUP_DIR, "state");

// Fachsprache-Tabellen im Schema fsp, in der Reihenfolge ihrer Abhängigkeiten
// (wichtig für die Wiederherstellung). Neue Tabellen hier ergänzen.
export const TABLES = [
  "profiles", "modules", "lessons", "progress", "submissions", "messages",
  "glossary_topics", "glossary_terms", "glossary_reviews", "feedback_drafts",
  "exams", "exam_attempts", "study_plans", "study_activity", "push_subscriptions", "mistakes",
];
// Primärschlüssel, falls nicht "id" (für upsert bei der Wiederherstellung).
export const KEYS = {
  glossary_reviews: "user_id,term_id",
  feedback_drafts: "submission_id",
  study_plans: "user_id",
  study_activity: "user_id,day",
};
export const BUCKETS = ["fsp-recordings", "fsp-media"];

export function log(...args) {
  console.log(new Date().toISOString(), ...args);
}

export function readState(name, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(STATE_DIR, name), "utf8"));
  } catch {
    return fallback;
  }
}

export function writeState(name, value) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(path.join(STATE_DIR, name), JSON.stringify(value, null, 2));
}

export function alertRecipient() {
  return env.ALERT_EMAIL || env.STAFF_NOTIFY_EMAIL;
}

// Schickt eine Warn-E-Mail. Gibt false zurück, wenn SMTP fehlt oder der Versand scheitert.
export async function sendAlert(subject, text) {
  const to = alertRecipient();
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD || !to) {
    log("Keine Warn-E-Mail möglich (SMTP oder ALERT_EMAIL fehlt):", subject);
    return false;
  }
  const port = Number(env.SMTP_PORT ?? 465);
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
  });
  try {
    await transporter.sendMail({
      from: env.SMTP_FROM || `"GWS Fachsprache" <${env.SMTP_USER}>`,
      to,
      subject: `[GWS Training] ${subject}`,
      text: `${text}\n\n-- \nAutomatische Nachricht vom Server ${env.NEXT_PUBLIC_SITE_URL ?? ""}`,
    });
    log("Warn-E-Mail verschickt an", to, ":", subject);
    return true;
  } catch (error) {
    log("Warn-E-Mail fehlgeschlagen:", error.message);
    return false;
  }
}
