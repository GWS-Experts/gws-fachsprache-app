import "server-only";
import webpush from "web-push";
import { createAdminClient, hasAdminKey } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/env";

// Push-Benachrichtigungen (Web Push mit VAPID). Schlüssel erzeugt `npm run push:setup`.
// Ohne Schlüssel bleibt Push aus, der Rest der App funktioniert normal.

export function vapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY ?? "";
}

export function pushConfigured() {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && hasAdminKey());
}

let configured = false;
function setup() {
  if (configured) return;
  const subject = process.env.VAPID_SUBJECT || (process.env.SMTP_USER ? `mailto:${process.env.SMTP_USER}` : siteUrl());
  webpush.setVapidDetails(subject, process.env.VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
  configured = true;
}

export interface PushMessage {
  title: string;
  body: string;
  url: string; // Seite, die beim Antippen geöffnet wird, z. B. /app/plan
  tag?: string; // gleiche tags ersetzen ältere Benachrichtigungen statt sie zu stapeln
}

type Row = { id: string; endpoint: string; p256dh: string; auth: string };

// Schickt die Nachricht an alle Geräte der Nutzer. Gibt die Zahl der Nutzer zurück,
// bei denen mindestens ein Gerät sie angenommen hat. Abgelaufene Abos werden gelöscht.
export async function sendPush(userIds: string[], message: PushMessage): Promise<number> {
  if (!pushConfigured() || userIds.length === 0) return 0;
  setup();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth")
    .in("user_id", userIds);
  if (error || !data) return 0;

  const payload = JSON.stringify(message);
  const reached = new Set<string>();
  const gone: string[] = [];
  const used: string[] = [];
  await Promise.all(
    (data as (Row & { user_id: string })[]).map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 6 * 3600, urgency: "normal" });
        reached.add(s.user_id);
        used.push(s.id);
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) gone.push(s.id);
        else console.error("Push-Versand fehlgeschlagen", status, (e as Error).message);
      }
    }),
  );
  if (gone.length) await supabase.from("push_subscriptions").delete().in("id", gone);
  if (used.length) await supabase.from("push_subscriptions").update({ last_used_at: new Date().toISOString() }).in("id", used);
  return reached.size;
}

// Alle GWS-Mitarbeitenden (für Hinweise auf neue Kundennachrichten).
export async function staffIds(): Promise<string[]> {
  if (!hasAdminKey()) return [];
  const { data } = await createAdminClient().from("profiles").select("id").eq("role", "staff");
  return (data ?? []).map((r) => r.id as string);
}
