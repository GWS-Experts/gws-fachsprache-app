// Schickt eine Test-Warnung an ALERT_EMAIL, um die Ausfall-E-Mails zu prüfen.
//   npm run ops:alert-test
import { alertRecipient, sendAlert } from "./common.mjs";

console.log("Empfänger:", alertRecipient() ?? "(fehlt: ALERT_EMAIL in .env.local eintragen)");
const ok = await sendAlert("Test der Ausfallüberwachung", "Diese Test-E-Mail zeigt: Warnungen vom Server kommen bei Ihnen an.");
console.log(ok ? "Test-Warnung verschickt. Bitte Posteingang (und Spam-Ordner) prüfen." : "Versand hat nicht geklappt (siehe oben).");
process.exit(ok ? 0 : 1);
