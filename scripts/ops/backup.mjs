// Tägliches Backup der Trainings-App (läuft per crontab auf dem VPS, siehe docs/BACKUP-UEBERWACHUNG.md).
//   npm run ops:backup
// 1. Alle Tabellen im Schema fsp -> BACKUP_DIR/db/fsp-JJJJ-MM-TT.json.gz (die letzten BACKUP_KEEP_DAYS Tage bleiben)
// 2. Alle Dateien der Buckets fsp-recordings und fsp-media -> BACKUP_DIR/storage/<bucket>/...
//    (nur neue oder geänderte Dateien werden geladen; lokal wird nie etwas gelöscht)
// Visa-Portal-Tabellen (Schema public) und Anmeldedaten (auth) werden nicht angefasst.
// Bei einem Fehler geht eine E-Mail an ALERT_EMAIL.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { createClient } from "@supabase/supabase-js";
import { BACKUP_DIR, BUCKETS, KEYS, TABLES, env, log, readState, sendAlert, writeState } from "./common.mjs";

const KEEP_DAYS = Number(env.BACKUP_KEEP_DAYS || 30);
const PAGE = 1000;

function client() {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL oder SUPABASE_SECRET_KEY fehlt in .env.local");
  }
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    db: { schema: "fsp" },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function dumpTable(supabase, table) {
  const order = (KEYS[table] ?? "id").split(",");
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    let query = supabase.from(table).select("*");
    for (const col of order) query = query.order(col);
    const { data, error } = await query.range(from, from + PAGE - 1);
    if (error) throw new Error(`Tabelle ${table}: ${error.message}`);
    rows.push(...data);
    if (data.length < PAGE) return rows;
  }
}

async function backupDatabase(supabase, day) {
  const tables = {};
  const counts = {};
  for (const table of TABLES) {
    tables[table] = await dumpTable(supabase, table);
    counts[table] = tables[table].length;
  }
  const dir = path.join(BACKUP_DIR, "db");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `fsp-${day}.json.gz`);
  const json = JSON.stringify({ created_at: new Date().toISOString(), schema: "fsp", tables });
  fs.writeFileSync(`${file}.tmp`, zlib.gzipSync(json));
  fs.renameSync(`${file}.tmp`, file);

  // Alte Tagesstände aufräumen
  const files = fs.readdirSync(dir).filter((f) => /^fsp-\d{4}-\d{2}-\d{2}\.json\.gz$/.test(f)).sort();
  for (const old of files.slice(0, Math.max(0, files.length - KEEP_DAYS))) fs.unlinkSync(path.join(dir, old));
  return { file, counts, kept: Math.min(files.length, KEEP_DAYS) };
}

async function listAll(supabase, bucket, prefix = "") {
  const out = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: PAGE, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error(`Bucket ${bucket}/${prefix}: ${error.message}`);
    for (const item of data) {
      const full = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) out.push(...(await listAll(supabase, bucket, full))); // Ordner
      else out.push({ path: full, size: item.metadata?.size ?? -1, type: item.metadata?.mimetype });
    }
    if (data.length < PAGE) return out;
  }
}

async function backupStorage(supabase) {
  const result = {};
  for (const bucket of BUCKETS) {
    const objects = await listAll(supabase, bucket);
    let downloaded = 0;
    for (const obj of objects) {
      const target = path.join(BACKUP_DIR, "storage", bucket, obj.path);
      if (!target.startsWith(path.join(BACKUP_DIR, "storage", bucket) + path.sep)) continue; // Schutz vor ../
      if (fs.existsSync(target) && fs.statSync(target).size === obj.size) continue;
      const { data, error } = await supabase.storage.from(bucket).download(obj.path);
      if (error) throw new Error(`Download ${bucket}/${obj.path}: ${error.message}`);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, Buffer.from(await data.arrayBuffer()));
      downloaded++;
    }
    // Dateitypen merken, damit die Wiederherstellung sie richtig hochladen kann
    const manifest = Object.fromEntries(objects.map((o) => [o.path, o.type]));
    fs.mkdirSync(path.join(BACKUP_DIR, "storage"), { recursive: true });
    fs.writeFileSync(path.join(BACKUP_DIR, "storage", `${bucket}.types.json`), JSON.stringify(manifest));
    result[bucket] = { files: objects.length, downloaded };
  }
  return result;
}

const day = new Date().toISOString().slice(0, 10);
const state = readState("backup.json", {});
try {
  const supabase = client();
  log("Backup startet nach", BACKUP_DIR);
  const db = await backupDatabase(supabase, day);
  log("Datenbank gesichert:", db.file, JSON.stringify(db.counts));
  const storage = await backupStorage(supabase);
  log("Dateien gesichert:", JSON.stringify(storage));
  writeState("backup.json", { ...state, lastSuccess: new Date().toISOString(), lastError: null, counts: db.counts, storage });
  if (state.lastError) await sendAlert("Backup läuft wieder", `Das Backup vom ${day} hat wieder geklappt.`);
  log("Backup fertig.");
} catch (error) {
  log("FEHLER beim Backup:", error.message);
  writeState("backup.json", { ...state, lastError: error.message, lastErrorAt: new Date().toISOString() });
  await sendAlert(
    "Backup fehlgeschlagen",
    `Das tägliche Backup der Trainings-App ist am ${day} fehlgeschlagen.\n\nFehler: ${error.message}\n\n` +
      `Letztes erfolgreiches Backup: ${state.lastSuccess ?? "noch keins"}\n` +
      `Details auf dem Server: ${path.join(BACKUP_DIR, "backup.log")}`,
  );
  process.exit(1);
}
