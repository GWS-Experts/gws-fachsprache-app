// Prüft die SMTP-Einstellungen aus .env.local und schickt eine Test-E-Mail.
// Aufruf im App-Ordner:  npm run mail:test -- deine@adresse.de
import nodemailer from "nodemailer";

const to = process.argv[2];
const env = process.env;

const checks = [
  ["NEXT_PUBLIC_SITE_URL", env.NEXT_PUBLIC_SITE_URL, "Adresse der App für Links in E-Mails"],
  ["SMTP_HOST", env.SMTP_HOST, "z. B. smtp.hostinger.com"],
  ["SMTP_PORT", env.SMTP_PORT, "meist 465"],
  ["SMTP_USER", env.SMTP_USER, "das Postfach, das verschickt"],
  ["SMTP_PASSWORD", env.SMTP_PASSWORD ? "(gesetzt)" : "", "Passwort dieses Postfachs"],
  ["STAFF_NOTIFY_EMAIL", env.STAFF_NOTIFY_EMAIL, "GWS-Postfach für Hinweise auf Kundennachrichten"],
];

console.log("Einstellungen in .env.local:");
for (const [name, value, hint] of checks) {
  console.log(`  ${value ? "OK    " : "FEHLT "} ${name}${value ? ` = ${value}` : `  (${hint})`}`);
}
console.log(`  Absender: ${env.SMTP_FROM || `"GWS Fachsprache" <${env.SMTP_USER ?? "?"}>`}`);

if (env.NEXT_PUBLIC_SITE_URL?.includes("localhost")) {
  console.log("\nHinweis: NEXT_PUBLIC_SITE_URL zeigt auf localhost. Auf dem Server muss dort https://training.gws-transfer-visa.com stehen.");
}

if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD) {
  console.log("\nSMTP ist nicht vollständig eingetragen. Es wird keine E-Mail verschickt.");
  process.exit(1);
}
if (!to) {
  console.log("\nBitte eine Empfängeradresse angeben, z. B.:  npm run mail:test -- deine@adresse.de");
  process.exit(1);
}

const port = Number(env.SMTP_PORT ?? 465);
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port,
  secure: port === 465,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
});
const from = env.SMTP_FROM || `"GWS Fachsprache" <${env.SMTP_USER}>`;

try {
  await transporter.verify();
  console.log("\nAnmeldung beim Mailserver: OK");
  await transporter.sendMail({
    from,
    to,
    subject: "Test-E-Mail der GWS Fachsprache-App",
    text: "Hallo,\n\ndiese Test-E-Mail zeigt: Der E-Mail-Versand der Trainings-App funktioniert.\n\nIhr GWS-Team",
  });
  console.log(`Test-E-Mail an ${to} verschickt. Bitte Posteingang (und Spam-Ordner) prüfen.`);
} catch (error) {
  console.log("\nFEHLER beim E-Mail-Versand:", error.message);
  if (error.code === "EAUTH") console.log("→ Benutzername oder Passwort des Postfachs stimmt nicht.");
  else if (["ECONNECTION", "ETIMEDOUT", "ESOCKET", "ECONNREFUSED"].includes(error.code)) {
    console.log("→ Mailserver nicht erreichbar. SMTP_HOST und SMTP_PORT prüfen.");
  } else if (error.responseCode === 553 || error.responseCode === 550) {
    console.log("→ Absender abgelehnt. SMTP_FROM muss dieselbe Adresse wie SMTP_USER verwenden.");
  }
  process.exit(1);
}
