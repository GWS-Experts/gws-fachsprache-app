import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "fsp-recordings";

// Sammelt alle Dateien unterhalb eines Ordners im Speicher (Aufnahmen liegen
// unter <Nutzer-ID>/<Lektion oder Prüfungsteil>/<Datei>).
async function listFiles(admin: ReturnType<typeof createAdminClient>, folder: string, depth = 0): Promise<string[]> {
  const files: string[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await admin.storage.from(BUCKET).list(folder, { limit: 1000, offset });
    if (error) throw error;
    for (const entry of data) {
      const path = `${folder}/${entry.name}`;
      // Ordner haben keine id; Dateien schon.
      if (entry.id) files.push(path);
      else if (depth < 4) files.push(...(await listFiles(admin, path, depth + 1)));
    }
    if (data.length < 1000) break;
  }
  return files;
}

// Löscht alle Daten eines Kunden aus der Trainings-App:
// Sprachaufnahmen im Speicher und das fsp-Profil. Über "on delete cascade"
// verschwinden damit auch Fortschritt, Abgaben, Feedback, Nachrichten,
// Fachbegriff-Lernstand, Lernplan, Lernzeiten, Prüfungsversuche und Fehlertrainer.
//
// Das Login-Konto (auth.users) bleibt bestehen, weil es mit dem Visa-Portal
// geteilt wird. Ohne fsp-Profil hat die Person keinen Zugang mehr zur App.
export async function deleteCustomerData(customerId: string): Promise<{ ok: true; files: number } | { ok: false; reason: "notFound" | "notCustomer" | "storage" | "db" }> {
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("id, role").eq("id", customerId).maybeSingle();
  if (!profile) return { ok: false, reason: "notFound" };
  if (profile.role !== "customer") return { ok: false, reason: "notCustomer" };

  let files: string[];
  try {
    files = await listFiles(admin, customerId);
  } catch {
    return { ok: false, reason: "storage" };
  }
  for (let i = 0; i < files.length; i += 100) {
    const { error } = await admin.storage.from(BUCKET).remove(files.slice(i, i + 100));
    if (error) return { ok: false, reason: "storage" };
  }

  const { error } = await admin.from("profiles").delete().eq("id", customerId);
  if (error) return { ok: false, reason: "db" };
  return { ok: true, files: files.length };
}
