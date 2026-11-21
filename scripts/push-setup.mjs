// Richtet Push-Benachrichtigungen ein: erzeugt einmalig ein Schlüsselpaar (VAPID)
// und trägt es in .env.local ein. Aufruf im App-Ordner:  npm run push:setup
// Ist schon ein Schlüssel eingetragen, wird nichts verändert (sonst müssten alle
// Geräte Push neu einschalten).
import fs from "node:fs";
import path from "node:path";
import webpush from "web-push";

const file = path.resolve(process.cwd(), ".env.local");
if (!fs.existsSync(file)) {
  console.error(`FEHLER: ${file} fehlt. Bitte im App-Ordner ausführen (cd /var/www/gws).`);
  process.exit(1);
}

let text = fs.readFileSync(file, "utf8");
const has = (name) => new RegExp(`^${name}=.+$`, "m").test(text);

if (has("VAPID_PUBLIC_KEY") && has("VAPID_PRIVATE_KEY")) {
  console.log("Push ist schon eingerichtet (VAPID_PUBLIC_KEY und VAPID_PRIVATE_KEY stehen in .env.local). Nichts geändert.");
  process.exit(0);
}

const { publicKey, privateKey } = webpush.generateVAPIDKeys();
const set = (name, value) => {
  const line = `${name}=${value}`;
  const re = new RegExp(`^${name}=.*$`, "m");
  text = re.test(text) ? text.replace(re, line) : `${text.replace(/\n?$/, "\n")}${line}\n`;
};
if (!/\n$/.test(text)) text += "\n";
if (!/Push-Benachrichtigungen/.test(text)) text += "\n# Push-Benachrichtigungen (erzeugt mit npm run push:setup)\n";
set("VAPID_PUBLIC_KEY", publicKey);
set("VAPID_PRIVATE_KEY", privateKey);
fs.writeFileSync(file, text);

console.log("Fertig: Push-Schlüssel wurden in .env.local eingetragen.");
console.log("Jetzt die App neu starten:  pm2 restart gws --update-env");
