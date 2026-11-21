// Spielt ein Backup zurück. Nur im Notfall verwenden.
//   npm run ops:restore -- /var/backups/gws/db/fsp-2026-11-21.json.gz              (nur anzeigen, ändert nichts)
//   npm run ops:restore -- /var/backups/gws/db/fsp-2026-11-21.json.gz --apply      (Zeilen zurückschreiben)
//   ... --apply --table messages        nur eine Tabelle
//   ... --apply --storage               zusätzlich fehlende Dateien (Aufnahmen, Medien) wieder hochladen
// Zeilen aus dem Backup werden eingefügt oder überschrieben (upsert). Zeilen, die erst nach dem
// Backup entstanden sind, bleiben erhalten. Das Visa-Portal wird nicht angefasst.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { createClient } from "@supabase/supabase-js";
import { BACKUP_DIR, BUCKETS, KEYS, TABLES, env } from "./common.mjs";

const MIME = {
  ".webm": "audio/webm", ".ogg": "audio/ogg", ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".mp4": "audio/mp4",
  ".wav": "audio/wav", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
};

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--table");
const apply = args.includes("--apply");
const withStorage = args.includes("--storage");
const onlyTable = args.includes("--table") ? args[args.indexOf("--table") + 1] : null;

if (!file || !fs.existsSync(file)) {
  console.log("Bitte eine Backup-Datei angeben. Vorhandene Backups:");
  const dir = path.join(BACKUP_DIR, "db");
  if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir).sort()) console.log("  " + path.join(dir, f));
  process.exit(1);
}
if (onlyTable && !TABLES.includes(onlyTable)) {
  console.log(`Unbekannte Tabelle "${onlyTable}". Möglich: ${TABLES.join(", ")}`);
  process.exit(1);
}

const backup = JSON.parse(zlib.gunzipSync(fs.readFileSync(file)).toString("utf8"));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  db: { schema: "fsp" },
  auth: { persistSession: false, autoRefreshToken: false },
});

console.log(`Backup vom ${backup.created_at}`);
console.log(apply ? "MODUS: zurückschreiben\n" : "MODUS: nur anzeigen (zum Zurückschreiben --apply anhängen)\n");
console.log("Tabelle".padEnd(20), "im Backup".padStart(10), "jetzt".padStart(10));

let failed = false;
for (const table of TABLES) {
  if (onlyTable && table !== onlyTable) continue;
  const rows = backup.tables[table] ?? [];
  const { count } = await supabase.from(table).select("*", { head: true, count: "exact" });
  console.log(table.padEnd(20), String(rows.length).padStart(10), String(count ?? "?").padStart(10));
  if (!apply) continue;
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase.from(table).upsert(rows.slice(i, i + 500), { onConflict: KEYS[table] ?? "id" });
    if (error) {
      console.log(`  FEHLER in ${table}: ${error.message}`);
      failed = true;
      break;
    }
  }
}

if (apply && withStorage) {
  for (const bucket of BUCKETS) {
    const root = path.join(BACKUP_DIR, "storage", bucket);
    if (!fs.existsSync(root)) continue;
    let uploaded = 0;
    let types = {};
    try {
      types = JSON.parse(fs.readFileSync(path.join(BACKUP_DIR, "storage", `${bucket}.types.json`), "utf8"));
    } catch {}
    for (const rel of fs.readdirSync(root, { recursive: true })) {
      const full = path.join(root, rel);
      if (!fs.statSync(full).isFile()) continue;
      const key = rel.split(path.sep).join("/");
      const { error } = await supabase.storage.from(bucket).upload(key, fs.readFileSync(full), {
        upsert: false,
        contentType: types[key] || MIME[path.extname(key).toLowerCase()] || "application/octet-stream",
      });
      if (!error) uploaded++;
      else if (!/exists|Duplicate/i.test(error.message)) console.log(`  FEHLER ${bucket}/${key}: ${error.message}`);
    }
    console.log(`Bucket ${bucket}: ${uploaded} fehlende Dateien wieder hochgeladen`);
  }
}

console.log(failed ? "\nNicht alles konnte zurückgeschrieben werden (siehe FEHLER oben)." : apply ? "\nFertig." : "");
process.exit(failed ? 1 : 0);
