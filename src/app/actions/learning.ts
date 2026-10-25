"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCustomer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const progressSchema = z.object({
  lessonId: z.string().uuid(),
  score: z.number().int().min(0),
  maxScore: z.number().int().min(0),
  durationSeconds: z.number().int().min(0).max(60 * 60 * 4),
});

export async function saveProgress(input: z.infer<typeof progressSchema>) {
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
  const { error } = await supabase.from("submissions").insert({
    lesson_id: v.lessonId,
    text: v.text || null,
    audio_path: v.audioPath || null,
  });
  if (error) return { ok: false };
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
