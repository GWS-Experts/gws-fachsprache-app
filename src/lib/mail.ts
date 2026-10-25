import "server-only";
import nodemailer from "nodemailer";

export function mailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
}

// Verschickt eine E-Mail über SMTP. Ohne SMTP-Konfiguration wird nichts
// verschickt und false zurückgegeben.
export async function sendMail({ to, subject, text }: { to: string; subject: string; text: string }) {
  if (!mailConfigured()) return false;
  const port = Number(process.env.SMTP_PORT ?? 465);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
  try {
    await transporter.sendMail({ from: process.env.SMTP_FROM ?? process.env.SMTP_USER, to, subject, text });
    return true;
  } catch (error) {
    console.error("E-Mail-Versand fehlgeschlagen", error);
    return false;
  }
}
