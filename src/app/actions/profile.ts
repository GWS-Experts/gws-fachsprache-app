"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { LOCALE_COOKIE } from "@/i18n/request";
import { siteUrl } from "@/lib/env";
import type { FormState } from "@/app/actions/auth";

const profileSchema = z.object({
  first_name: z.string().trim().min(1).max(100),
  last_name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email(),
  locale: z.enum(["de", "en"]),
});

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const profile = await requireProfile();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "invalid" };
  const { email, ...rest } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(rest).eq("id", profile.id);
  if (error) return { error: "generic" };

  const store = await cookies();
  store.set(LOCALE_COOKIE, rest.locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });

  if (email !== profile.email) {
    // Supabase schickt einen Bestätigungslink an die neue Adresse; erst danach wird sie übernommen.
    const { error: emailError } = await supabase.auth.updateUser({ email }, { emailRedirectTo: `${siteUrl()}/` });
    if (emailError) return { error: "email" };
    revalidatePath("/", "layout");
    return { success: "emailPending" };
  }
  revalidatePath("/", "layout");
  return { success: "saved" };
}

const passwordSchema = z
  .object({ password: z.string().min(8), confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: "mismatch" });

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireProfile();
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues.some((i) => i.message === "mismatch") ? "mismatch" : "tooShort" };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "generic" };
  return { success: "passwordSaved" };
}
