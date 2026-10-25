"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { createAdminClient, hasAdminKey } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { mailConfigured, sendMail } from "@/lib/mail";
import { siteUrl } from "@/lib/env";

export type InviteState = { error?: string; success?: string; link?: string } | undefined;

const inviteSchema = z.object({
  first_name: z.string().trim().min(1).max(100),
  last_name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email(),
  locale: z.enum(["de", "en"]),
  role: z.enum(["customer", "staff"]),
});

// Lädt Kunden (oder GWS-Kollegen) per E-Mail ein. Der Link führt zur Seite,
// auf der das eigene Passwort festgelegt wird.
export async function inviteUser(_prev: InviteState, formData: FormData): Promise<InviteState> {
  await requireStaff();
  if (!hasAdminKey()) return { error: "noKey" };
  const parsed = inviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "invalid" };
  const v = parsed.data;
  const admin = createAdminClient();
  const meta = { app: "fsp", first_name: v.first_name, last_name: v.last_name, locale: v.locale };

  let type: "invite" | "magiclink" = "invite";
  let result = await admin.auth.admin.generateLink({ type: "invite", email: v.email, options: { data: meta } });

  if (result.error) {
    // Konto existiert schon (z. B. aus dem Visa-Portal): Zugang zur Trainings-App ergänzen.
    type = "magiclink";
    result = await admin.auth.admin.generateLink({ type: "magiclink", email: v.email });
    if (result.error || !result.data.user) return { error: "generic" };
  }

  const userId = result.data.user!.id;
  const { data: existing } = await admin.from("profiles").select("id").eq("id", userId).maybeSingle();
  if (existing) {
    await admin.from("profiles").update({ first_name: v.first_name, last_name: v.last_name, role: v.role }).eq("id", userId);
  } else {
    const { error } = await admin
      .from("profiles")
      .insert({ id: userId, email: v.email, first_name: v.first_name, last_name: v.last_name, locale: v.locale, role: v.role });
    if (error) return { error: "generic" };
  }

  const link = `${siteUrl()}/auth/confirm?token_hash=${result.data.properties.hashed_token}&type=${type}&next=/auth/set-password`;
  const t = await getTranslations({ locale: v.locale, namespace: "mail" });
  const sent = await sendMail({ to: v.email, subject: t("inviteSubject"), text: t("inviteBody", { name: v.first_name, link }) });

  revalidatePath("/admin");
  if (sent) return { success: "sent" };
  return { success: mailConfigured() ? "mailFailed" : "noMail", link };
}

const staffProfileSchema = z.object({
  id: z.string().uuid(),
  first_name: z.string().trim().min(1).max(100),
  last_name: z.string().trim().min(1).max(100),
});

export async function updateCustomer(_prev: InviteState, formData: FormData): Promise<InviteState> {
  await requireStaff();
  const parsed = staffProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "invalid" };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ first_name: parsed.data.first_name, last_name: parsed.data.last_name }).eq("id", parsed.data.id);
  if (error) return { error: "generic" };
  revalidatePath(`/admin/customers/${parsed.data.id}`);
  return { success: "saved" };
}

const feedbackSchema = z.object({
  id: z.string().uuid(),
  feedback: z.string().trim().min(1).max(10000),
});

export async function saveFeedback(_prev: InviteState, formData: FormData): Promise<InviteState> {
  const staff = await requireStaff();
  const parsed = feedbackSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "invalid" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("submissions")
    .update({ feedback: parsed.data.feedback, feedback_by: staff.id, feedback_at: new Date().toISOString() })
    .eq("id", parsed.data.id)
    .select("user_id")
    .single();
  if (error) return { error: "generic" };

  const { data: customer } = await supabase.from("profiles").select("email, first_name, locale").eq("id", data.user_id).maybeSingle();
  if (customer) {
    const t = await getTranslations({ locale: customer.locale, namespace: "mail" });
    await sendMail({
      to: customer.email,
      subject: t("feedbackSubject"),
      text: t("feedbackBody", { name: customer.first_name || customer.email, link: `${siteUrl()}/app/progress` }),
    });
  }
  revalidatePath("/admin/submissions");
  revalidatePath(`/admin/customers/${data.user_id}`);
  return { success: "saved" };
}
