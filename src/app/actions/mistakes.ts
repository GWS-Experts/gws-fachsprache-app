"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCustomer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isCorrect } from "@/lib/questions";
import { MASTERY_STREAK, type Mistake } from "@/lib/mistakes";

const practiceSchema = z.object({
  id: z.string().uuid(),
  answer: z.union([z.string().max(500), z.number().int()]),
});

// Eine Antwort im Fehlertrainer: richtig zählt zur Serie, falsch setzt sie zurück.
export async function practiceMistake(input: z.input<typeof practiceSchema>): Promise<{ ok: boolean; correct?: boolean; mastered?: boolean }> {
  const profile = await requireCustomer();
  const v = practiceSchema.parse(input);
  const supabase = await createClient();
  const { data } = await supabase.from("mistakes").select("*").eq("id", v.id).eq("user_id", profile.id).maybeSingle();
  if (!data) return { ok: false };
  const m = data as Mistake;
  const correct = isCorrect(m.question, v.answer);
  const now = new Date().toISOString();
  const streak = correct ? m.right_streak + 1 : 0;
  const mastered = correct && streak >= MASTERY_STREAK;
  const { error } = await supabase
    .from("mistakes")
    .update(
      correct
        ? { right_streak: streak, mastered_at: mastered ? now : null, last_practiced_at: now }
        : { right_streak: 0, wrong_count: m.wrong_count + 1, last_wrong_at: now, last_practiced_at: now },
    )
    .eq("id", m.id);
  if (error) return { ok: false };
  return { ok: true, correct, mastered };
}

// Fehler aus dem Trainer entfernen (z. B. wenn eine Korrektur nicht passt).
export async function dismissMistake(id: string): Promise<{ ok: boolean }> {
  const profile = await requireCustomer();
  const supabase = await createClient();
  const { error } = await supabase.from("mistakes").delete().eq("id", z.string().uuid().parse(id)).eq("user_id", profile.id);
  return { ok: !error };
}

export async function refreshMistakes() {
  await requireCustomer();
  revalidatePath("/app", "layout");
}
