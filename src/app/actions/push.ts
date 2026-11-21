"use server";

import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { pushConfigured, sendPush } from "@/lib/push";

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(1000).startsWith("https://"),
  keys: z.object({ p256dh: z.string().min(1).max(200), auth: z.string().min(1).max(100) }),
});

// Gerät für Push-Benachrichtigungen anmelden. Nutzt ein Gerät vorher jemand anderes,
// wird das Abo auf den aktuellen Nutzer umgeschrieben.
export async function savePushSubscription(subscription: unknown, userAgent: string) {
  const profile = await requireProfile();
  if (!pushConfigured()) return { ok: false };
  const parsed = subscriptionSchema.safeParse(subscription);
  if (!parsed.success) return { ok: false };
  const { endpoint, keys } = parsed.data;
  const { error } = await createAdminClient()
    .from("push_subscriptions")
    .upsert(
      { user_id: profile.id, endpoint, p256dh: keys.p256dh, auth: keys.auth, user_agent: userAgent.slice(0, 300) },
      { onConflict: "endpoint" },
    );
  return { ok: !error };
}

export async function deletePushSubscription(endpoint: string) {
  const profile = await requireProfile();
  if (!pushConfigured() || typeof endpoint !== "string") return { ok: false };
  const { error } = await createAdminClient().from("push_subscriptions").delete().eq("endpoint", endpoint).eq("user_id", profile.id);
  return { ok: !error };
}

export async function sendTestPush() {
  const profile = await requireProfile();
  const t = await getTranslations({ locale: profile.locale === "en" ? "en" : "de", namespace: "push" });
  const reached = await sendPush([profile.id], {
    title: t("testTitle"),
    body: t("testBody"),
    url: profile.role === "staff" ? "/admin" : "/app",
    tag: "test",
  });
  return { ok: reached > 0 };
}
