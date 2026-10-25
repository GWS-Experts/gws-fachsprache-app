"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LOCALE_COOKIE } from "@/i18n/request";
import { createClient } from "@/lib/supabase/server";

export async function setLocale(locale: string) {
  const value = locale === "en" ? "en" : "de";
  const store = await cookies();
  store.set(LOCALE_COOKIE, value, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims?.sub) {
    await supabase.from("profiles").update({ locale: value }).eq("id", data.claims.sub);
  }
  revalidatePath("/", "layout");
}
