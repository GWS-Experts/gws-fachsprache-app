"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendMail } from "@/lib/mail";
import { siteUrl } from "@/lib/env";
import type { FormState } from "@/app/actions/auth";

const schema = z.object({
  customerId: z.string().uuid(),
  body: z.string().trim().min(1).max(5000),
  lessonId: z.string().uuid().optional().or(z.literal("").transform(() => undefined)),
});

export async function sendMessage(_prev: FormState, formData: FormData): Promise<FormState> {
  const profile = await requireProfile();
  const parsed = schema.safeParse({
    customerId: formData.get("customerId"),
    body: formData.get("body"),
    lessonId: formData.get("lessonId") ?? undefined,
  });
  if (!parsed.success) return { error: "invalid" };
  const { customerId, body, lessonId } = parsed.data;

  // Kunden schreiben nur in ihren eigenen Verlauf; RLS erzwingt das zusätzlich.
  if (profile.role === "customer" && customerId !== profile.id) return { error: "invalid" };

  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({ customer_id: customerId, body, lesson_id: lessonId ?? null });
  if (error) return { error: "generic" };

  if (profile.role === "staff") {
    // GWS hat geantwortet: Kundennachrichten gelten als gelesen, Kunde bekommt eine E-Mail.
    await supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("customer_id", customerId).eq("sender_id", customerId).is("read_at", null);
    const { data: customer } = await supabase.from("profiles").select("email, first_name, locale").eq("id", customerId).maybeSingle();
    if (customer) {
      const t = await getTranslations({ locale: customer.locale, namespace: "mail" });
      await sendMail({
        to: customer.email,
        subject: t("replySubject"),
        text: t("replyBody", { name: customer.first_name || customer.email, link: `${siteUrl()}/app/messages` }),
      });
    }
    revalidatePath(`/admin/customers/${customerId}`);
    revalidatePath("/admin/messages");
  } else {
    const to = process.env.STAFF_NOTIFY_EMAIL;
    if (to) {
      const t = await getTranslations({ locale: "de", namespace: "mail" });
      const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email;
      await sendMail({
        to,
        subject: t("staffSubject", { name }),
        text: t("staffBody", { name, body, link: `${siteUrl()}/admin/customers/${profile.id}` }),
      });
    }
    revalidatePath("/app/messages");
  }
  return { success: "sent" };
}
