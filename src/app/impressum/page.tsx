import type { Metadata } from "next";
import { LegalShell } from "@/components/LegalShell";
import { LEGAL, isPlaceholder } from "@/content/legal";

export const metadata: Metadata = { title: "Impressum – GWS Fachsprache" };

// ENTWURF – keine Rechtsberatung. Firmendaten stehen in src/content/legal.ts.
export default function ImprintPage() {
  const fields = [LEGAL.street, LEGAL.city, LEGAL.managingDirectors, LEGAL.phone, LEGAL.email, LEGAL.register, LEGAL.registerNumber, LEGAL.contentResponsible];
  return (
    <LegalShell title="Impressum" draft={fields.some(isPlaceholder)}>
      <h2>Angaben gemäß § 5 DDG</h2>
      <p>
        {LEGAL.company}
        <br />
        {LEGAL.street}
        <br />
        {LEGAL.city}
        <br />
        {LEGAL.country}
      </p>
      <p>
        <strong>Vertreten durch die Geschäftsführerin:</strong> {LEGAL.managingDirectors}
      </p>

      <h2>Kontakt</h2>
      <p>
        Telefon: {LEGAL.phone}
        <br />
        E-Mail: {isPlaceholder(LEGAL.email) ? LEGAL.email : <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>}
      </p>

      <h2>Registereintrag</h2>
      <p>
        Registergericht: {LEGAL.register}
        <br />
        Registernummer: {LEGAL.registerNumber}
      </p>

      {LEGAL.vatId && (
        <>
          <h2>Umsatzsteuer-Identifikationsnummer</h2>
          <p>Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz: {LEGAL.vatId}</p>
        </>
      )}

      <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
      <p>{LEGAL.contentResponsible}</p>

      <h2>Verbraucherstreitbeilegung</h2>
      <p>
        Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer
        Verbraucherschlichtungsstelle teilzunehmen.
      </p>

      <h2>Haftung für Inhalte und Links</h2>
      <p>
        Die Inhalte dieser Trainings-App wurden mit größter Sorgfalt erstellt. Für die Richtigkeit,
        Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Die
        Übungen bereiten auf die Fachsprachprüfung vor; ein bestimmtes Prüfungsergebnis wird nicht
        zugesichert. Für Inhalte verlinkter externer Seiten sind ausschließlich deren Betreiber
        verantwortlich.
      </p>

      <h2>Urheberrecht</h2>
      <p>
        Die Lerninhalte, Texte, Aufnahmen und Grafiken dieser App unterliegen dem deutschen
        Urheberrecht. Sie dürfen nur im Rahmen des Trainings genutzt und nicht ohne Zustimmung von{" "}
        {LEGAL.company} weitergegeben oder vervielfältigt werden.
      </p>
    </LegalShell>
  );
}
