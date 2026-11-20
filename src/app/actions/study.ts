"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCustomer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { validTimeZone } from "@/lib/study";

// Begriff aus einer Lektion auf die Übungsliste setzen (im Vokabeltrainer unter „nicht gewusst“).
export async function markTermToLearn(termId: string) {
  const profile = await requireCustomer();
  if (!z.string().uuid().safeParse(termId).success) return { ok: false };
  const supabase = await createClient();
  const { data: prev } = await supabase
    .from("glossary_reviews")
    .select("term_id")
    .eq("user_id", profile.id)
    .eq("term_id", termId)
    .maybeSingle();
  const { error } = prev
    ? await supabase.from("glossary_reviews").update({ known: false }).eq("user_id", profile.id).eq("term_id", termId)
    : await supabase.from("glossary_reviews").insert({ user_id: profile.id, term_id: termId, known: false, reviews: 0 });
  if (error) return { ok: false };
  revalidatePath("/app/glossary", "layout");
  return { ok: true };
}

export type PlanState = { error?: string; success?: string } | undefined;

const planSchema = z.object({
  daily_minutes: z.coerce.number().int().min(5).max(120),
  days: z.array(z.coerce.number().int().min(1).max(7)).min(1).max(7),
  remind: z.boolean(),
  remind_hour: z.coerce.number().int().min(0).max(23),
  timezone: z.string().trim().max(64).refine(validTimeZone),
});

export async function saveStudyPlan(_prev: PlanState, formData: FormData): Promise<PlanState> {
  const profile = await requireCustomer();
  const parsed = planSchema.safeParse({
    daily_minutes: formData.get("daily_minutes"),
    days: [...new Set(formData.getAll("days"))],
    remind: formData.get("remind") === "on",
    remind_hour: formData.get("remind_hour"),
    timezone: formData.get("timezone") || "Europe/Berlin",
  });
  if (!parsed.success) return { error: parsed.error.issues.some((i) => i.path[0] === "days") ? "noDays" : "invalid" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("study_plans")
    .upsert({ user_id: profile.id, ...parsed.data, days: [...parsed.data.days].sort() }, { onConflict: "user_id" });
  if (error) return { error: "generic" };
  revalidatePath("/app", "layout");
  return { success: "saved" };
}
