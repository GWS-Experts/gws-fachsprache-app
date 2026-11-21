// Firmendaten für Impressum und Datenschutzerklärung – an EINER Stelle.
// Alles in [eckigen Klammern] ist ein Platzhalter und muss vor dem
// produktiven Einsatz durch die echten Angaben ersetzt werden.
// Leere Felder ("") werden auf den Seiten einfach weggelassen.

export const LEGAL = {
  company: "GWS talent transfer GmbH",
  street: "[Straße und Hausnummer]",
  city: "[PLZ Ort]",
  country: "Deutschland",
  managingDirectors: "[Vor- und Nachname der Geschäftsführung]",
  phone: "[Telefonnummer]",
  email: "[E-Mail-Adresse für Anfragen]",
  register: "[Registergericht, z. B. Amtsgericht München]",
  registerNumber: "[HRB-Nummer]",
  vatId: "[USt-IdNr., z. B. DE123456789 – falls vorhanden]",
  // Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV (Name und Anschrift)
  contentResponsible: "[Vor- und Nachname, Anschrift wie oben]",
  // Datenschutzbeauftragte(r) – nur nötig, wenn einer benannt ist; sonst "" lassen.
  dataProtectionOfficer: "",
  // Zuständige Datenschutz-Aufsichtsbehörde (für Firmen in Bayern das BayLDA)
  supervisoryAuthority:
    "[Bayerisches Landesamt für Datenschutzaufsicht (BayLDA), Promenade 18, 91522 Ansbach – bitte prüfen, ob Bayern zutrifft]",
  // Wie lange Daten nach Ende der Zusammenarbeit aufbewahrt werden
  retention: "[z. B. 6 Monate nach Ende des Trainings]",
  // Stand der Texte
  updated: "21.11.2026",
} as const;

export function isPlaceholder(value: string) {
  return value.startsWith("[");
}
