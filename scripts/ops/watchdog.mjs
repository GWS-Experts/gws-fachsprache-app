// Ausfallüberwachung (läuft alle 5 Minuten per crontab auf dem VPS, siehe docs/BACKUP-UEBERWACHUNG.md).
//   npm run ops:watchdog
// - Ruft https://<NEXT_PUBLIC_SITE_URL>/api/health auf (prüft nginx, Zertifikat, App und Datenbank).
// - Antwortet die App lokal gar nicht mehr, wird sie einmal per pm2 neu gestartet.
// - Ist sie zwei Läufe hintereinander (ca. 10 Minuten) nicht erreichbar: E-Mail an ALERT_EMAIL,
//   danach alle 6 Stunden eine Erinnerung, und eine Entwarnung, sobald sie wieder läuft.
// - Einmal am Tag: Zertifikat bald abgelaufen? Festplatte fast voll? Backup zu alt? -> E-Mail.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import tls from "node:tls";
import { BACKUP_DIR, env, log, readState, sendAlert, writeState } from "./common.mjs";

const SITE = (env.NEXT_PUBLIC_SITE_URL || "https://training.gws-transfer-visa.com").replace(/\/$/, "");
const APP_NAME = env.APP_NAME || "gws";
const LOCAL = `http://127.0.0.1:${env.APP_PORT || 3010}/api/health`;
const FAILS_BEFORE_ALERT = 2;
const REMIND_HOURS = 6;

async function check(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000), cache: "no-store" });
    if (res.ok) return { ok: true, detail: `HTTP ${res.status}` };
    const body = await res.json().catch(() => null);
    const hint = body && body.db === false ? " (Datenbank nicht erreichbar)" : "";
    return { ok: false, answered: true, detail: `HTTP ${res.status}${hint}` };
  } catch (error) {
    return { ok: false, answered: false, detail: `keine Antwort (${error.cause?.code ?? error.name})` };
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const now = new Date();
const state = readState("watchdog.json", { failures: 0 });

let pub = await check(`${SITE}/api/health`);
if (!pub.ok) {
  await sleep(10000);
  pub = await check(`${SITE}/api/health`);
}

if (pub.ok) {
  if (state.alerted) {
    const minutes = Math.round((now - new Date(state.downSince)) / 60000);
    await sendAlert("App läuft wieder", `${SITE} ist wieder erreichbar (Ausfall ca. ${minutes} Minuten, seit ${state.downSince}).`);
  } else if (state.failures > 0) {
    log("Kurze Störung, wieder in Ordnung:", state.lastDetail);
  }
  writeState("watchdog.json", { ...state, failures: 0, alerted: false, restarted: false, downSince: null, lastOk: now.toISOString() });
} else {
  const local = await check(LOCAL);
  let restarted = state.restarted;
  let restartNote = "";
  if (!local.answered && !state.restarted) {
    try {
      execFileSync("pm2", ["restart", APP_NAME], { stdio: "pipe", timeout: 60000 });
      restarted = true;
      restartNote = `Die App wurde automatisch neu gestartet (pm2 restart ${APP_NAME}).`;
      log(restartNote);
    } catch (error) {
      restarted = true;
      restartNote = `Automatischer Neustart (pm2 restart ${APP_NAME}) hat nicht geklappt: ${error.message.split("\n")[0]}`;
      log(restartNote);
    }
  }
  const failures = (state.failures ?? 0) + 1;
  const downSince = state.downSince ?? now.toISOString();
  log(`Störung (${failures}. Lauf): öffentlich ${pub.detail}, lokal ${local.detail}`);
  const lastAlert = state.lastAlertAt ? new Date(state.lastAlertAt) : null;
  const due = failures >= FAILS_BEFORE_ALERT && (!state.alerted || now - lastAlert > REMIND_HOURS * 3600000);
  let alerted = state.alerted;
  let lastAlertAt = state.lastAlertAt;
  if (due) {
    const sent = await sendAlert(
      state.alerted ? "App ist weiterhin ausgefallen" : "App ist ausgefallen",
      `${SITE} ist seit ${downSince} nicht erreichbar.\n\n` +
        `Von außen: ${pub.detail}\nAuf dem Server (Port ${env.APP_PORT || 3010}): ${local.detail}\n` +
        (restartNote || (restarted ? "Ein automatischer Neustart wurde bereits versucht.\n" : "")) +
        `\n\nWas tun? Siehe docs/BACKUP-UEBERWACHUNG.md, Abschnitt "Wenn eine Ausfall-E-Mail kommt".\n` +
        `Erste Hilfe in der Hostinger-Konsole:  pm2 status   und   pm2 logs ${APP_NAME} --lines 50`,
    );
    if (sent) {
      alerted = true;
      lastAlertAt = now.toISOString();
    }
  }
  writeState("watchdog.json", { ...state, failures, downSince, alerted, lastAlertAt, restarted, lastDetail: `${pub.detail} / lokal ${local.detail}` });
}

// --- Tägliche Prüfungen -----------------------------------------------------
const today = now.toISOString().slice(0, 10);
const daily = readState("daily.json", {});
if (daily.day !== today) {
  const warnings = [];

  try {
    const host = new URL(SITE).hostname;
    const cert = await new Promise((resolve, reject) => {
      const socket = tls.connect({ host, port: 443, servername: host, timeout: 15000 }, () => {
        resolve(socket.getPeerCertificate());
        socket.end();
      });
      socket.on("error", reject);
      socket.on("timeout", () => reject(new Error("Zeitüberschreitung")));
    });
    const days = Math.floor((new Date(cert.valid_to) - now) / 86400000);
    if (days < 14) warnings.push(`Das HTTPS-Zertifikat für ${host} läuft in ${days} Tagen ab (${cert.valid_to}). Erneuern: sudo certbot renew`);
  } catch (error) {
    warnings.push(`Zertifikat konnte nicht geprüft werden: ${error.message}`);
  }

  try {
    const s = fs.statfsSync("/");
    const used = Math.round(100 - (s.bavail / s.blocks) * 100);
    if (used >= 90) warnings.push(`Die Festplatte des Servers ist zu ${used} % voll.`);
  } catch {}

  const backup = readState("backup.json", {});
  const ageHours = backup.lastSuccess ? (now - new Date(backup.lastSuccess)) / 3600000 : Infinity;
  if (ageHours > 30) {
    warnings.push(
      backup.lastSuccess
        ? `Das letzte erfolgreiche Backup ist ${Math.round(ageHours)} Stunden alt (${backup.lastSuccess}).`
        : `Es gibt noch kein erfolgreiches Backup in ${BACKUP_DIR}.`,
    );
  }

  if (warnings.length) await sendAlert("Wartungshinweis", warnings.map((w) => `- ${w}`).join("\n"));
  writeState("daily.json", { day: today, warnings });
  log("Tägliche Prüfung:", warnings.length ? warnings.join(" | ") : "alles in Ordnung");
}
