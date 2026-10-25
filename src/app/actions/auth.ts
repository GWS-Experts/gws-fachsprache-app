"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasAdminKey } from "@/lib/supabase/admin";
import { LOCALE_COOKIE } from "@/i18n/request";
import { sendMail } from "@/lib/mail";
import { siteUrl } from "@/lib/env";
import { getTranslations } from "next-intl/server";

export type FormState = { error?: string; success?: string } | undefined;

const credentials = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = credentials.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: "invalid" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) return { error: "invalid" };

  const { data: profile } = await supabase.from("profiles").select("role, locale").eq("id", data.user.id).maybeSingle();
  if (!profile) {
    // Konto existiert (z. B. im Visa-Portal), hat aber keinen Zugang zur Trainings-App.
    await supabase.auth.signOut();
    return { error: "no_access" };
  }

  const store = await cookies();
  store.set(LOCALE_COOKIE, profile.locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  redirect(profile.role === "staff" ? "/admin" : "/app");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = z.string().trim().toLowerCase().email().safeParse(formData.get("email"));
  if (!email.success) return { error: "invalid" };

  // Immer dieselbe Antwort, damit niemand herausfinden kann, welche Adressen registriert sind.
  const done: FormState = { success: "sent" };
  if (!hasAdminKey()) return done;

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("id, first_name, locale").eq("email", email.data).maybeSingle();
  if (!profile) return done;

  const { data, error } = await admin.auth.admin.generateLink({ type: "recovery", email: email.data });
  if (error || !data.properties?.hashed_token) return done;

  const link = `${siteUrl()}/auth/confirm?token_hash=${data.properties.hashed_token}&type=recovery&next=/auth/set-password`;
  const t = await getTranslations({ locale: profile.locale, namespace: "mail" });
  await sendMail({
    to: email.data,
    subject: t("resetSubject"),
    text: t("resetBody", { name: profile.first_name || email.data, link }),
  });
  return done;
}

const passwordSchema = z
  .object({ password: z.string().min(8), confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: "mismatch" });

export async function setPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = passwordSchema.safeParse({ password: formData.get("password"), confirm: formData.get("confirm") });
  if (!parsed.success) {
    return { error: parsed.error.issues.some((i) => i.message === "mismatch") ? "mismatch" : "tooShort" };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "generic" };
  redirect("/");
}
