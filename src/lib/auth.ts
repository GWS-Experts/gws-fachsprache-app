import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

// Liest Nutzer und fsp-Profil einmal pro Anfrage.
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return (profile as Profile | null) ?? null;
});

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?error=no_access");
  return profile;
}

export async function requireStaff(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "staff") redirect("/app");
  return profile;
}

export async function requireCustomer(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "customer") redirect("/admin");
  return profile;
}
