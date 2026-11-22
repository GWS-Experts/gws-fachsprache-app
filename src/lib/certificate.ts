import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { ExamArea, ExamSummary } from "@/lib/exam";

// Übungszertifikat (PDF) für eine bestandene Probeprüfung.
// Ausdrücklich KEIN Nachweis der offiziellen Fachsprachprüfung.

export interface CertificateData {
  number: string;
  name: string;
  examTitle: string;
  examDate: Date;
  issuedDate: Date;
  passPercent: number;
  summary: ExamSummary;
}

const AREA_LABEL: Record<ExamArea, string> = {
  reading: "Lesen",
  language: "Sprachbausteine",
  listening: "Hören",
  writing: "Schreiben",
  speaking: "Sprechen",
};

const PRIMARY = rgb(0x0b / 255, 0x2f / 255, 0x63 / 255);
const ACCENT = rgb(0x1a / 255, 0x7f / 255, 0xc1 / 255);
const LIME = rgb(0xa8 / 255, 0xbf / 255, 0x2e / 255);
const INK = rgb(0x1c / 255, 0x27 / 255, 0x33 / 255);
const MUTED = rgb(0x5b / 255, 0x68 / 255, 0x78 / 255);
const LIGHT = rgb(0xe8 / 255, 0xee / 255, 0xf7 / 255);

export function certificateNumber(attemptId: string, date: Date) {
  return `GWS-FSP-${date.getFullYear()}-${attemptId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}


function wrap(text: string, font: PDFFont, size: number, maxWidth: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const test = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function centered(page: PDFPage, text: string, y: number, font: PDFFont, size: number, color = INK) {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (page.getWidth() - w) / 2, y, size, font, color });
}

// Schrift so weit verkleinern, dass der Text in die Breite passt (z. B. lange Namen).
function fitSize(text: string, font: PDFFont, size: number, maxWidth: number, min = 14) {
  let s = size;
  while (s > min && font.widthOfTextAtSize(text, s) > maxWidth) s -= 1;
  return s;
}

export async function renderCertificate(d: CertificateData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const [regularBytes, boldBytes, serifBytes, logoBytes] = await Promise.all([
    // Feste Pfade, damit der Build genau diese Dateien mitnimmt (Schriften: SIL Open Font License, assets/fonts).
    readFile(path.join(process.cwd(), "assets/fonts/LiberationSans-Regular.ttf")),
    readFile(path.join(process.cwd(), "assets/fonts/LiberationSans-Bold.ttf")),
    readFile(path.join(process.cwd(), "assets/fonts/LiberationSerif-Bold.ttf")),
    readFile(path.join(process.cwd(), "public/gws-logo.png")),
  ]);
  const regular = await pdf.embedFont(regularBytes, { subset: true });
  const bold = await pdf.embedFont(boldBytes, { subset: true });
  const serif = await pdf.embedFont(serifBytes, { subset: true });
  const logo = await pdf.embedPng(logoBytes);

  pdf.setTitle(`Übungszertifikat – ${d.name}`);
  pdf.setAuthor("GWS language GmbH");
  pdf.setSubject(`Probeprüfung ${d.examTitle} (interne Übungsprüfung, keine offizielle Fachsprachprüfung)`);
  pdf.setCreator("GWS Fachsprache Trainings-App");
  pdf.setCreationDate(d.issuedDate);

  const page = pdf.addPage([595.28, 841.89]); // A4
  const W = page.getWidth();
  const H = page.getHeight();
  const margin = 36;
  const contentWidth = W - 2 * 72;
  const date = (x: Date) => new Intl.DateTimeFormat("de-DE", { dateStyle: "long", timeZone: "Europe/Berlin" }).format(x);

  // Rahmen
  page.drawRectangle({ x: margin, y: margin, width: W - 2 * margin, height: H - 2 * margin, borderColor: PRIMARY, borderWidth: 2.5 });
  page.drawRectangle({ x: margin + 7, y: margin + 7, width: W - 2 * margin - 14, height: H - 2 * margin - 14, borderColor: ACCENT, borderWidth: 0.75 });
  page.drawRectangle({ x: margin + 7, y: H - margin - 13, width: W - 2 * margin - 14, height: 6, color: LIME });

  // Kopf
  let y = H - 136;
  const logoSize = 70;
  page.drawImage(logo, { x: (W - logoSize) / 2, y, width: logoSize, height: logoSize });
  y -= 20;
  centered(page, "GWS language GmbH", y, bold, 12, PRIMARY);
  y -= 46;
  centered(page, "ZERTIFIKAT", y, serif, 40, PRIMARY);
  y -= 24;
  centered(page, "Übungszertifikat · Probeprüfung Fachsprache Pflege (B2)", y, regular, 12, ACCENT);

  // Text
  y -= 40;
  centered(page, "Hiermit wird bestätigt, dass", y, regular, 12, MUTED);
  y -= 38;
  const nameSize = fitSize(d.name, serif, 28, contentWidth);
  centered(page, d.name, y, serif, nameSize, INK);
  page.drawLine({ start: { x: 150, y: y - 10 }, end: { x: W - 150, y: y - 10 }, thickness: 0.75, color: ACCENT });
  y -= 36;
  const sentence = `am ${date(d.examDate)} die Probeprüfung „${d.examTitle}“ im Trainingsprogramm der GWS language GmbH erfolgreich bestanden hat.`;
  for (const line of wrap(sentence, regular, 12, contentWidth)) {
    centered(page, line, y, regular, 12, INK);
    y -= 17;
  }

  // Ergebnis
  y -= 12;
  const tableX = 130;
  const tableW = W - 2 * tableX;
  const rows: { label: string; value: string; strong?: boolean }[] = [
    { label: "Gesamtergebnis", value: `${d.summary.total.percent ?? 0} %  (${d.summary.total.score} von ${d.summary.total.max} Punkten)`, strong: true },
  ];
  if (d.summary.written.max > 0) rows.push({ label: "Schriftlicher Teil", value: `${d.summary.written.percent ?? 0} %` });
  if (d.summary.oral.max > 0) rows.push({ label: "Mündlicher Teil", value: `${d.summary.oral.percent ?? 0} %` });
  for (const a of d.summary.areas) rows.push({ label: `   ${AREA_LABEL[a.area]}`, value: `${a.percent ?? 0} %` });

  const rowH = 17;
  const tableH = rows.length * rowH + 26;
  page.drawRectangle({ x: tableX, y: y - tableH, width: tableW, height: tableH, color: LIGHT });
  let ry = y - 18;
  page.drawText("Ergebnis", { x: tableX + 14, y: ry, size: 11, font: bold, color: PRIMARY });
  ry -= rowH;
  for (const r of rows) {
    const f = r.strong ? bold : regular;
    page.drawText(r.label, { x: tableX + 14, y: ry, size: 11, font: f, color: r.strong ? INK : MUTED });
    const vw = f.widthOfTextAtSize(r.value, 11);
    page.drawText(r.value, { x: tableX + tableW - 14 - vw, y: ry, size: 11, font: f, color: INK });
    ry -= rowH;
  }
  y -= tableH + 14;
  centered(page, `Bestehensgrenze: mindestens ${d.passPercent} % im schriftlichen und im mündlichen Teil`, y, regular, 9, MUTED);

  // Ort, Datum, Unterschrift
  y = 178;
  page.drawText(`Marzling, ${date(d.issuedDate)}`, { x: 80, y, size: 11, font: regular, color: INK });
  page.drawLine({ start: { x: 80, y: y - 8 }, end: { x: 250, y: y - 8 }, thickness: 0.5, color: MUTED });
  page.drawText("Ort, Datum", { x: 80, y: y - 20, size: 8, font: regular, color: MUTED });
  page.drawText("GWS language GmbH", { x: W - 250, y, size: 11, font: bold, color: PRIMARY });
  page.drawLine({ start: { x: W - 250, y: y - 8 }, end: { x: W - 80, y: y - 8 }, thickness: 0.5, color: MUTED });
  page.drawText("Prüfungsteam", { x: W - 250, y: y - 20, size: 8, font: regular, color: MUTED });

  // Hinweis
  const note =
    "Wichtiger Hinweis: Dieses Zertifikat bestätigt das Ergebnis einer internen Probeprüfung im Lernprogramm der GWS language GmbH. " +
    "Es ist keine offizielle Fachsprachprüfung (FSP) und kein amtlicher Sprachnachweis. Es ersetzt keine Prüfung bei der zuständigen Stelle " +
    "und wird von Behörden nicht als Nachweis anerkannt.";
  const noteLines = wrap(note, regular, 8.5, W - 2 * 96);
  const noteH = noteLines.length * 11.5 + 16;
  const noteY = 80;
  page.drawRectangle({ x: 84, y: noteY, width: W - 168, height: noteH, borderColor: ACCENT, borderWidth: 0.75 });
  let ny = noteY + noteH - 15;
  for (const line of noteLines) {
    page.drawText(line, { x: 96, y: ny, size: 8.5, font: regular, color: INK });
    ny -= 11.5;
  }

  centered(page, `Zertifikat-Nr. ${d.number}  ·  GWS language GmbH  ·  Nordring 8a  ·  85417 Marzling`, 56, regular, 7.5, MUTED);

  return pdf.save();
}
