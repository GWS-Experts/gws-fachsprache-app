"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { LESSON_KINDS } from "@/lib/types";

export type ContentState = { error?: string; success?: string } | undefined;

const moduleSchema = z.object({
  title_de: z.string().trim().min(1).max(200),
  title_en: z.string().trim().max(200).default(""),
  description_de: z.string().trim().max(2000).default(""),
  description_en: z.string().trim().max(2000).default(""),
  sort: z.coerce.number().int().min(0).max(9999).default(0),
  published: z.preprocess((v) => v === "on" || v === "true", z.boolean()),
});

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "modul"
  );
}

export async function createModule(_prev: ContentState, formData: FormData): Promise<ContentState> {
  await requireStaff();
  const parsed = moduleSchema.safeParse({ ...Object.fromEntries(formData), published: formData.get("published") });
  if (!parsed.success) return { error: "invalid" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("modules")
    .insert({ ...parsed.data, slug: `${slugify(parsed.data.title_de)}-${Date.now().toString(36)}` })
    .select("id")
    .single();
  if (error) return { error: "generic" };
  revalidatePath("/admin/content");
  redirect(`/admin/content/${data.id}`);
}

export async function updateModule(_prev: ContentState, formData: FormData): Promise<ContentState> {
  await requireStaff();
  const id = z.string().uuid().safeParse(formData.get("id"));
  const parsed = moduleSchema.safeParse({ ...Object.fromEntries(formData), published: formData.get("published") });
  if (!id.success || !parsed.success) return { error: "invalid" };
  const supabase = await createClient();
  const { error } = await supabase.from("modules").update(parsed.data).eq("id", id.data);
  if (error) return { error: "generic" };
  revalidatePath("/admin/content", "layout");
  revalidatePath("/app", "layout");
  return { success: "saved" };
}

export async function deleteModule(formData: FormData) {
  await requireStaff();
  const id = z.string().uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("modules").delete().eq("id", id);
  revalidatePath("/admin/content", "layout");
  redirect("/admin/content");
}

const newLessonSchema = z.object({
  module_id: z.string().uuid(),
  kind: z.enum(LESSON_KINDS as [string, ...string[]]),
  title_de: z.string().trim().min(1).max(200),
});

export async function createLesson(_prev: ContentState, formData: FormData): Promise<ContentState> {
  await requireStaff();
  const parsed = newLessonSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "invalid" };
  const supabase = await createClient();
  const { count } = await supabase.from("lessons").select("id", { count: "exact", head: true }).eq("module_id", parsed.data.module_id);
  const { data, error } = await supabase
    .from("lessons")
    .insert({ ...parsed.data, sort: (count ?? 0) + 1, content: {} })
    .select("id")
    .single();
  if (error) return { error: "generic" };
  redirect(`/admin/content/lesson/${data.id}`);
}

const question = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("mc"),
    prompt: z.string().trim().min(1),
    options: z.array(z.string().trim().min(1)).min(2).max(8),
    answer: z.number().int().min(0),
    explanation: z.string().trim().optional(),
  }),
  z.object({
    type: z.literal("gap"),
    prompt: z.string().trim().min(1),
    answer: z.string().trim().min(1),
    alternatives: z.array(z.string().trim().min(1)).optional(),
    explanation: z.string().trim().optional(),
  }),
]);

const contentSchema = z.object({
  intro_de: z.string().optional(),
  intro_en: z.string().optional(),
  text: z.string().optional(),
  transcript: z.string().optional(),
  audio_path: z.string().nullable().optional(),
  lines: z.array(z.object({ speaker: z.string().trim().min(1), text: z.string().trim().min(1) })).optional(),
  items: z
    .array(
      z.object({
        term: z.string().trim().min(1),
        article: z.string().trim().optional(),
        plural: z.string().trim().optional(),
        en: z.string().trim().min(1),
        example: z.string().trim().optional(),
      }),
    )
    .optional(),
  questions: z.array(question).optional(),
  task_de: z.string().optional(),
  task_en: z.string().optional(),
  hints: z.array(z.string().trim().min(1)).optional(),
  min_words: z.number().int().min(0).max(2000).optional(),
  max_seconds: z.number().int().min(10).max(900).optional(),
});

const lessonSchema = z.object({
  id: z.string().uuid(),
  title_de: z.string().trim().min(1).max(200),
  title_en: z.string().trim().max(200),
  sort: z.number().int().min(0).max(9999),
  published: z.boolean(),
  content: contentSchema,
});

export async function saveLesson(input: z.input<typeof lessonSchema>): Promise<ContentState & { issues?: string[] }> {
  await requireStaff();
  const parsed = lessonSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "invalid", issues: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) };
  }
  const { id, content, ...rest } = parsed.data;
  if (content.questions?.some((q) => q.type === "mc" && q.answer >= q.options.length)) return { error: "invalid", issues: ["questions.answer"] };

  const supabase = await createClient();
  const { data, error } = await supabase.from("lessons").update({ ...rest, content }).eq("id", id).select("module_id").single();
  if (error) return { error: "generic" };
  revalidatePath(`/admin/content/${data.module_id}`);
  revalidatePath("/app", "layout");
  return { success: "saved" };
}

export async function deleteLesson(formData: FormData) {
  await requireStaff();
  const id = z.string().uuid().parse(formData.get("id"));
  const supabase = await createClient();
  const { data } = await supabase.from("lessons").delete().eq("id", id).select("module_id").single();
  revalidatePath("/admin/content", "layout");
  redirect(data ? `/admin/content/${data.module_id}` : "/admin/content");
}
