"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireCustomer, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type GlossaryState = { error?: string; success?: string; count?: number; line?: string } | undefined;

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "thema"
  );
}

function revalidateGlossary() {
  revalidatePath("/admin/content/glossary", "layout");
  revalidatePath("/app/glossary", "layout");
}

// Themen ------------------------------------------------------------------
const topicSchema = z.object({
  icon: z.string().trim().max(8).default("📘"),
  title_de: z.string().trim().min(1).max(200),
  title_en: z.string().trim().max(200).default(""),
  description_de: z.string().trim().max(2000).default(""),
  description_en: z.string().trim().max(2000).default(""),
  sort: z.coerce.number().int().min(0).max(9999).default(0),
  published: z.preprocess((v) => v === "on" || v === "true", z.boolean()),
});

function parseTopic(formData: FormData) {
  return topicSchema.safeParse({ ...Object.fromEntries(formData), icon: formData.get("icon") || "📘", published: formData.get("published") });
}

export async function createGlossaryTopic(_prev: GlossaryState, formData: FormData): Promise<GlossaryState> {
  await requireStaff();
  const parsed = parseTopic(formData);
  if (!parsed.success) return { error: "invalid" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("glossary_topics")
    .insert({ ...parsed.data, slug: `${slugify(parsed.data.title_de)}-${Date.now().toString(36)}` })
    .select("id")
    .single();
  if (error) return { error: "generic" };
  revalidateGlossary();
  redirect(`/admin/content/glossary/${data.id}`);
}

export async function updateGlossaryTopic(_prev: GlossaryState, formData: FormData): Promise<GlossaryState> {
  await requireStaff();
  const id = z.string().uuid().safeParse(formData.get("id"));
  const parsed = parseTopic(formData);
  if (!id.success || !parsed.success) return { error: "invalid" };
  const supabase = await createClient();
  const { error } = await supabase.from("glossary_topics").update(parsed.data).eq("id", id.data);
  if (error) return { error: "generic" };
  revalidateGlossary();
  return { success: "saved" };
}

export async function deleteGlossaryTopic(formData: FormData) {
  await requireStaff();
  const id = z.string().uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("glossary_topics").delete().eq("id", id);
  revalidateGlossary();
  redirect("/admin/content/glossary");
}

// Begriffe ----------------------------------------------------------------
const termSchema = z.object({
  topic_id: z.string().uuid(),
  article: z.enum(["", "der", "die", "das"]).default(""),
  term: z.string().trim().min(1).max(200),
  plural: z.string().trim().max(200).default(""),
  explanation: z.string().trim().max(1000).default(""),
  en: z.string().trim().max(300).default(""),
  example: z.string().trim().max(1000).default(""),
  sort: z.coerce.number().int().min(0).max(99999).optional(),
});

export async function saveGlossaryTerm(_prev: GlossaryState, formData: FormData): Promise<GlossaryState> {
  await requireStaff();
  const id = formData.get("id") ? z.string().uuid().safeParse(formData.get("id")) : null;
  const parsed = termSchema.safeParse({ ...Object.fromEntries(formData), sort: formData.get("sort") || undefined });
  if ((id && !id.success) || !parsed.success) return { error: "invalid" };
  const supabase = await createClient();

  if (id?.success) {
    const { error } = await supabase.from("glossary_terms").update(parsed.data).eq("id", id.data);
    if (error) return { error: error.code === "23505" ? "duplicate" : "generic" };
  } else {
    const { count } = await supabase.from("glossary_terms").select("id", { count: "exact", head: true }).eq("topic_id", parsed.data.topic_id);
    const { error } = await supabase.from("glossary_terms").insert({ ...parsed.data, sort: parsed.data.sort ?? (count ?? 0) + 1 });
    if (error) return { error: error.code === "23505" ? "duplicate" : "generic" };
  }
  revalidateGlossary();
  return { success: "saved" };
}

export async function deleteGlossaryTerm(formData: FormData) {
  await requireStaff();
  const id = z.string().uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("glossary_terms").delete().eq("id", id);
  revalidateGlossary();
}

// Mehrere Begriffe auf einmal einfügen, eine Zeile pro Begriff:
// Artikel; Begriff; Plural; Erklärung; Englisch; Beispielsatz (Tabulator oder | gehen auch,
// z. B. beim Einfügen aus Excel). Vorhandene Begriffe im Thema werden aktualisiert.
export async function importGlossaryTerms(_prev: GlossaryState, formData: FormData): Promise<GlossaryState> {
  await requireStaff();
  const topicId = z.string().uuid().safeParse(formData.get("topic_id"));
  const text = z.string().max(200_000).safeParse(formData.get("lines"));
  if (!topicId.success || !text.success) return { error: "invalid" };

  const lines = text.data.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const rows = [];
  for (const line of lines) {
    const sep = line.includes("\t") ? "\t" : line.includes("|") ? "|" : ";";
    const [article = "", term = "", plural = "", explanation = "", en = "", example = ""] = line.split(sep).map((s) => s.trim());
    const a = article.toLowerCase();
    if (!term || !["", "der", "die", "das"].includes(a)) return { error: "importLine", line };
    rows.push({ topic_id: topicId.data, article: a, term, plural, explanation, en, example });
  }
  if (rows.length === 0) return { error: "invalid" };
  const unique = [...new Map(rows.map((r) => [r.term, r])).values()];

  const supabase = await createClient();
  const { count } = await supabase.from("glossary_terms").select("id", { count: "exact", head: true }).eq("topic_id", topicId.data);
  const { error } = await supabase
    .from("glossary_terms")
    .upsert(unique.map((r, i) => ({ ...r, sort: (count ?? 0) + i + 1 })), { onConflict: "topic_id,term", ignoreDuplicates: false });
  if (error) return { error: "generic" };
  revalidateGlossary();
  return { success: "imported", count: unique.length };
}

// Vokabeltrainer ------------------------------------------------------------
const reviewSchema = z.object({ termId: z.string().uuid(), known: z.boolean() });

export async function recordGlossaryReview(input: z.infer<typeof reviewSchema>) {
  const profile = await requireCustomer();
  const v = reviewSchema.parse(input);
  const supabase = await createClient();
  const { data: prev } = await supabase
    .from("glossary_reviews")
    .select("reviews")
    .eq("user_id", profile.id)
    .eq("term_id", v.termId)
    .maybeSingle();
  const { error } = await supabase
    .from("glossary_reviews")
    .upsert({ user_id: profile.id, term_id: v.termId, known: v.known, reviews: (prev?.reviews ?? 0) + 1 }, { onConflict: "user_id,term_id" });
  return { ok: !error };
}

export async function resetGlossaryProgress() {
  const profile = await requireCustomer();
  const supabase = await createClient();
  await supabase.from("glossary_reviews").delete().eq("user_id", profile.id);
  revalidatePath("/app/glossary", "layout");
}
