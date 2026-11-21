import type { Metadata } from "next";
import { LegalShell } from "@/components/LegalShell";
import { LEGAL, isPlaceholder } from "@/content/legal";

export const metadata: Metadata = { title: "Datenschutzerklärung – GWS Fachsprache" };

// ENTWURF – keine Rechtsberatung. Vor dem produktiven Einsatz von einer
// fachkundigen Person prüfen lassen. Firmendaten stehen in src/content/legal.ts.
export default function PrivacyPage() {
  const fields = [LEGAL.street, LEGAL.city, LEGAL.email, LEGAL.supervisoryAuthority, LEGAL.retention];
  return (
    <LegalShell title="Datenschutzerklärung" draft={fields.some(isPlaceholder)}>
      <p>
        In dieser Erklärung informieren wir dich darüber, welche personenbezogenen Daten wir in der
        Trainings-App „GWS Fachsprache“ (training.gws-transfer-visa.com) verarbeiten, wofür wir das tun
        und welche Rechte du hast.
      </p>

      <h2>1. Verantwortlicher</h2>
      <p>
        {LEGAL.company}
        <br />
        {LEGAL.street}, {LEGAL.city}
        <br />
        E-Mail: {LEGAL.email}
      </p>
      {LEGAL.dataProtectionOfficer && (
        <p>
          <strong>Datenschutzbeauftragte(r):</strong> {LEGAL.dataProtectionOfficer}
        </p>
      )}

      <h2>2. Welche Daten wir verarbeiten</h2>
      <ul>
        <li><strong>Konto:</strong> Vor- und Nachname, E-Mail-Adresse, Passwort (nur verschlüsselt gespeichert), gewählte Sprache, Rolle in der App.</li>
        <li><strong>Lernfortschritt:</strong> bearbeitete Lektionen, Ergebnisse, Lernzeit pro Tag, gelernte Fachbegriffe, Lernplan und Erinnerungszeiten.</li>
        <li><strong>Abgaben:</strong> deine Texte aus Schreibübungen und deine Sprachaufnahmen aus Sprechübungen sowie das Feedback von GWS dazu.</li>
        <li><strong>Probeprüfungen:</strong> Antworten, Texte, Aufnahmen und Ergebnisse deiner Prüfungsversuche.</li>
        <li><strong>Nachrichten:</strong> der Nachrichtenverlauf zwischen dir und GWS.</li>
        <li><strong>Technische Daten:</strong> beim Aufruf der App IP-Adresse, Datum und Uhrzeit, aufgerufene Seite und Browser-Kennung (Server-Protokolle).</li>
      </ul>

      <h2>3. Zwecke und Rechtsgrundlagen</h2>
      <p>
        Wir verarbeiten deine Daten, um dir das Sprachtraining zur Vorbereitung auf die
        Fachsprachprüfung bereitzustellen: Zugang zur App, Speicherung deines Fortschritts, Feedback zu
        deinen Übungen, Nachrichten mit GWS und Lern-Erinnerungen per E-Mail. Rechtsgrundlage ist die
        Durchführung des Vertrags bzw. der vorvertraglichen Maßnahmen mit dir (Art. 6 Abs. 1 lit. b
        DSGVO).
      </p>
      <p>
        Server-Protokolle verarbeiten wir, um die App sicher und stabil zu betreiben (berechtigtes
        Interesse, Art. 6 Abs. 1 lit. f DSGVO). Lern-Erinnerungen kannst du jederzeit im Lernplan
        abschalten.
      </p>

      <h2>4. Hosting und Dienstleister</h2>
      <p>Wir setzen folgende Dienstleister ein, die Daten in unserem Auftrag verarbeiten (Auftragsverarbeitung nach Art. 28 DSGVO):</p>
      <ul>
        <li>
          <strong>Hostinger</strong> (Hostinger International Ltd., Zypern): Server, auf dem die App läuft, und
          Versand von E-Mails (Einladungen, Hinweise auf Feedback und Antworten, Lern-Erinnerungen).
          Serverstandort: [Land des Server-Standorts, z. B. Deutschland/EU – im Hostinger-Konto prüfen].
        </li>
        <li>
          <strong>Supabase</strong> (Supabase Inc., USA): Datenbank, Anmeldung und Speicher für
          Sprachaufnahmen. Die Daten liegen in einem Rechenzentrum in Frankfurt am Main (EU).
        </li>
        <li>
          <strong>Anthropic</strong> (Anthropic PBC, USA): KI-gestützte Korrekturvorschläge für
          Schreibübungen. Nur wenn ein GWS-Mitarbeiter einen Vorschlag anfordert, werden der Text deiner
          Schreibübung und die Aufgabenstellung übermittelt – ohne deinen Namen oder deine
          E-Mail-Adresse. Der Vorschlag wird von GWS geprüft, bevor du ihn als Feedback erhältst; es
          findet keine automatisierte Entscheidung im Sinne von Art. 22 DSGVO statt.
        </li>
      </ul>
      <p>
        Bei Dienstleistern mit Sitz in den USA kann ein Zugriff aus einem Drittland nicht
        ausgeschlossen werden. Die Übermittlung erfolgt auf Grundlage der EU-Standardvertragsklauseln
        bzw. – soweit der Anbieter zertifiziert ist – des EU-US Data Privacy Framework (Art. 44 ff.
        DSGVO).
      </p>

      <h2>5. Mikrofon und Sprachausgabe</h2>
      <p>
        Für Sprechübungen fragt dein Browser um Erlaubnis, das Mikrofon zu nutzen. Aufgenommen wird
        nur, solange du die Aufnahme selbst startest. Die Aufnahme wird erst gespeichert, wenn du sie
        abschickst.
      </p>
      <p>
        Zum Vorlesen von Übungstexten nutzt die App die Sprachausgabe deines Browsers. Je nach Browser
        kann dabei der vorzulesende Übungstext an den Browser-Anbieter (z. B. Google, Microsoft, Apple)
        übermittelt werden. Es handelt sich um Lerninhalte, nicht um deine persönlichen Daten.
      </p>

      <h2>6. Cookies</h2>
      <p>
        Wir verwenden nur Cookies, die für die App technisch notwendig sind: ein Anmelde-Cookie, damit
        du eingeloggt bleibst, und ein Cookie für die gewählte Sprache (§ 25 Abs. 2 TDDDG). Wir setzen
        keine Analyse-, Tracking- oder Werbe-Cookies ein.
      </p>

      <h2>7. Speicherdauer</h2>
      <p>
        Wir speichern deine Daten, solange du an unserem Training teilnimmst. Danach werden deine
        Lerndaten, Abgaben, Aufnahmen und Nachrichten gelöscht: {LEGAL.retention}, soweit keine
        gesetzlichen Aufbewahrungspflichten entgegenstehen. Du kannst die Löschung jederzeit vorher
        verlangen, auch direkt in der App unter „Mein Profil“. Server-Protokolle werden in der Regel
        nach 14 Tagen gelöscht.
      </p>
      <p>
        Hinweis: Dein Login-Konto (E-Mail-Adresse und Passwort) wird gemeinsam mit dem Visa-Portal von{" "}
        {LEGAL.company} genutzt. Wenn du auch das Visa-Portal nicht mehr nutzt, löschen wir auf Wunsch
        auch dieses Konto.
      </p>

      <h2>8. Deine Rechte</h2>
      <p>Du hast das Recht auf</p>
      <ul>
        <li>Auskunft über deine gespeicherten Daten (Art. 15 DSGVO),</li>
        <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO),</li>
        <li>Löschung (Art. 17 DSGVO) und Einschränkung der Verarbeitung (Art. 18 DSGVO),</li>
        <li>Datenübertragbarkeit (Art. 20 DSGVO),</li>
        <li>Widerspruch gegen Verarbeitungen auf Grundlage berechtigter Interessen (Art. 21 DSGVO).</li>
      </ul>
      <p>
        Schreib uns dazu einfach eine Nachricht in der App oder eine E-Mail an {LEGAL.email}. Außerdem
        kannst du dich bei einer Datenschutz-Aufsichtsbehörde beschweren, zum Beispiel bei der für uns
        zuständigen Behörde: {LEGAL.supervisoryAuthority}.
      </p>

      <h2>9. Pflicht zur Bereitstellung</h2>
      <p>
        Name und E-Mail-Adresse brauchen wir, um dir einen Zugang einzurichten. Ohne diese Angaben
        kannst du die App nicht nutzen. Alle Übungsabgaben sind freiwillig.
      </p>
    </LegalShell>
  );
}
