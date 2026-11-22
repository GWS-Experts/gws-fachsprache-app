"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { requireCustomer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasAdminKey } from "@/lib/supabase/admin";
import { AI_MODEL, aiConfigured, generateFeedbackDraft } from "@/lib/ai";
import type { Lesson } from "@/lib/types";
import { recordQuestionResults } from "@/lib/mistakes-data";

const progressSchema = z.object({
  lessonId: z.string().uuid(),
  score: z.number().int().min(0),
  maxScore: z.number().int().min(0),
  durationSeconds: z.number().int().min(0).max(60 * 60 * 4),
  // Antworten pro Frage (für den Fehlertrainer); fehlt bei Übungen ohne Fragen.
  answers: z.array(z.union([z.string().max(500), z.number().int(), z.null()])).max(200).optional(),
});

export async function saveProgress(input: z.input<typeof progressSchema>) {
  const profile = await requireCustomer();
  const v = progressSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from("progress").insert({
    user_id: profile.id,
    lesson_id: v.lessonId,
    score: Math.min(v.score, v.maxScore),
    max_score: v.maxScore,
    duration_seconds: v.durationSeconds,
  });
  if (error) return { ok: false };
  if (v.answers) {
    const { data: lesson } = await supabase.from("lessons").select("*").eq("id", v.lessonId).maybeSingle();
    if (lesson) await recordQuestionResults(supabase, profile.id, lesson as Lesson, v.answers, "lesson");
  }
  revalidatePath("/app", "layout");
  return { ok: true };
}

const submissionSchema = z
  .object({
    lessonId: z.string().uuid(),
    text: z.string().trim().max(20000).optional(),
    audioPath: z.string().max(300).optional(),
    durationSeconds: z.number().int().min(0).max(60 * 60 * 4).default(0),
  })
  .refine((v) => Boolean(v.text) || Boolean(v.audioPath));

export async function submitWork(input: z.input<typeof submissionSchema>) {
  const profile = await requireCustomer();
  const v = submissionSchema.parse(input);
  // Aufnahmen dürfen nur aus dem eigenen Ordner stammen (zusätzlich zur Storage-Policy).
  if (v.audioPath && !v.audioPath.startsWith(`${profile.id}/`)) return { ok: false };

  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("submissions")
    .insert({
      lesson_id: v.lessonId,
      text: v.text || null,
      audio_path: v.audioPath || null,
    })
    .select("id")
    .single();
  if (error) return { ok: false };

  // Schreibabgabe: KI-Korrekturvorschlag im Hintergrund vorbereiten, damit er
  // für GWS schon bereitliegt. Kunden sehen ihn nicht (nur GWS hat Zugriff).
  const text = v.text;
  if (text && aiConfigured() && hasAdminKey()) {
    after(async () => {
      const admin = createAdminClient();
      const { data: lesson } = await admin.from("lessons").select("*").eq("id", v.lessonId).maybeSingle();
      const draft = await generateFeedbackDraft({ lesson: (lesson as Lesson | null) ?? undefined, text });
      if (draft) await admin.from("feedback_drafts").upsert({ submission_id: created.id, draft, model: AI_MODEL });
    });
  }
  await supabase.from("progress").insert({
    user_id: profile.id,
    lesson_id: v.lessonId,
    score: 0,
    max_score: 0,
    duration_seconds: v.durationSeconds,
  });
  revalidatePath("/app", "layout");
  return { ok: true };
}
