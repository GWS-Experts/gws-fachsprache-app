// Firmendaten für Impressum und Datenschutzerklärung – an EINER Stelle.
// Alles in [eckigen Klammern] ist ein Platzhalter und muss vor dem
// produktiven Einsatz durch die echten Angaben ersetzt werden.
// Leere Felder ("") werden auf den Seiten einfach weggelassen.

export const LEGAL = {
  company: "GWS language GmbH",
  street: "Nordring 8a",
  city: "85417 Marzling",
  country: "Deutschland",
  managingDirectors: "Dr. Dr. Agata Ehrhard",
  phone: "+49 151 61735220",
  email: "agata.ehrhard@gws-experts.com",
  register: "Amtsgericht München",
  registerNumber: "HRB 290451",
  // Nur eintragen, wenn eine USt-IdNr. vorhanden ist (die Steuernummer gehört nicht ins Impressum).
  vatId: "",
  // Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV (Name und Anschrift)
  contentResponsible: "Dr. Dr. Agata Ehrhard, Nordring 8a, 85417 Marzling",
  // Datenschutzbeauftragte(r) – nur eintragen, wenn förmlich jemand benannt ist; sonst "" lassen.
  // Die Geschäftsführung selbst kann diese Rolle nicht übernehmen (Interessenkonflikt).
  dataProtectionOfficer: "",
  // Zuständige Datenschutz-Aufsichtsbehörde (für Firmen in Bayern das BayLDA)
  supervisoryAuthority: "Bayerisches Landesamt für Datenschutzaufsicht (BayLDA), Promenade 18, 91522 Ansbach",
  // Standort des App-Servers bei Hostinger
  serverLocation: "Deutschland (Frankfurt am Main)",
  // Stand der Texte
  updated: "21.11.2026",
} as const;

export function isPlaceholder(value: string) {
  return value.startsWith("[");
}
