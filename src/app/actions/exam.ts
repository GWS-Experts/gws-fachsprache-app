"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireCustomer, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAttempt, getExam, getExamParts } from "@/lib/exam-data";
import { autoScore, isManual, partMax, partMinutes, summarize, type ExamAttempt, type PartAnswer } from "@/lib/exam";
import { getTranslations } from "next-intl/server";
import { sendMail } from "@/lib/mail";
import { sendPush } from "@/lib/push";
import { siteUrl } from "@/lib/env";
import type { Lesson } from "@/lib/types";
import { recordQuestionResults } from "@/lib/mistakes-data";

const uuid = z.string().uuid();

// Kunde startet eine Probeprüfung. Eine noch laufende Prüfung wird fortgesetzt statt neu begonnen.
export async function startExam(formData: FormData) {
  const profile = await requireCustomer();
  const examId = uuid.parse(formData.get("exam_id"));
  const supabase = await createClient();

  const { data: open } = await supabase
    .from("exam_attempts")
    .select("id")
    .eq("user_id", profile.id)
    .eq("exam_id", examId)
    .is("finished_at", null)
    .limit(1)
    .maybeSingle();
  if (open) redirect(`/app/exam/attempt/${open.id}`);

  const exam = await getExam(examId);
  if (!exam?.published) redirect("/app/exam");
  const parts = await getExamParts(exam);
  if (parts.length === 0) redirect("/app/exam");

  const { data, error } = await supabase.from("exam_attempts").insert({ exam_id: examId }).select("id").single();
  if (error || !data) redirect(`/app/exam/${examId}?error=1`);
  revalidatePath("/app/exam");
  redirect(`/app/exam/attempt/${data.id}`);
}

const finishSchema = z.object({
  attemptId: uuid,
  partIndex: z.number().int().min(0),
  answers: z.array(z.union([z.string().max(500), z.number().int(), z.null()])).max(200).optional(),
  text: z.string().max(20000).optional(),
  audioPath: z.string().max(300).optional(),
  timedOut: z.boolean().optional(),
});

function autoResults(parts: Lesson[], answers: Record<string, PartAnswer>) {
  const results = parts.map((l) => ({
    lesson_id: l.id,
    max: partMax(l),
    score: isManual(l) ? null : autoScore(l, answers[l.id]),
  }));
  const auto = results.filter((r) => r.score !== null);
  return { results, score: auto.reduce((s, r) => s + (r.score ?? 0), 0), max_score: auto.reduce((s, r) => s + r.max, 0) };
}

// Schließt den aktuellen Prüfungsteil ab (per Klick oder wenn die Zeit abgelaufen ist)
// und startet den nächsten. Nach dem letzten Teil wird die Prüfung ausgewertet.
export async function finishPart(input: z.input<typeof finishSchema>): Promise<{ ok: boolean; finished?: boolean }> {
  const profile = await requireCustomer();
  const v = finishSchema.parse(input);
  const attempt = await getAttempt(v.attemptId);
  if (!attempt || attempt.user_id !== profile.id) return { ok: false };
  if (attempt.finished_at) return { ok: true, finished: true };
  // Doppelter Aufruf (z. B. Klick und Zeitablauf gleichzeitig): nichts tun.
  if (v.partIndex !== attempt.current_part) return { ok: true };

  const exam = await getExam(attempt.exam_id);
  if (!exam) return { ok: false };
  const parts = await getExamParts(exam);
  const lesson = parts[v.partIndex];
  if (!lesson) return { ok: false };

  const supabase = await createClient();
  const limit = partMinutes(lesson) * 60;
  const elapsed = Math.round((Date.now() - new Date(attempt.part_started_at).getTime()) / 1000);
  const seconds = Math.max(0, Math.min(elapsed, limit));

  const entry: PartAnswer = { seconds, timed_out: Boolean(v.timedOut) || elapsed > limit + 5 };
  if (lesson.kind === "writing") {
    const text = v.text?.trim() ?? "";
    entry.text = text;
    if (text) {
      const { data } = await supabase.from("submissions").insert({ lesson_id: lesson.id, text }).select("id").single();
      entry.submission_id = data?.id ?? null;
    }
  } else if (lesson.kind === "speaking") {
    const path = v.audioPath && v.audioPath.startsWith(`${profile.id}/`) ? v.audioPath : null;
    entry.audio_path = path;
    if (path) {
      const { data } = await supabase.from("submissions").insert({ lesson_id: lesson.id, audio_path: path }).select("id").single();
      entry.submission_id = data?.id ?? null;
    }
  } else {
    entry.answers = v.answers ?? [];
  }

  const answers = { ...attempt.answers, [lesson.id]: entry };
  const next = v.partIndex + 1;
  const finished = next >= parts.length;
  const update: Partial<ExamAttempt> & Record<string, unknown> = {
    answers,
    current_part: next,
    part_started_at: new Date().toISOString(),
  };
  if (finished) Object.assign(update, autoResults(parts, answers), { finished_at: new Date().toISOString() });

  const { error } = await supabase.from("exam_attempts").update(update).eq("id", attempt.id);
  if (error) return { ok: false };
  // Falsche Antworten landen im Fehlertrainer.
  if (!isManual(lesson)) await recordQuestionResults(supabase, profile.id, lesson, entry.answers ?? [], "exam");
  revalidatePath("/app/exam", "layout");
  return { ok: true, finished };
}

// Prüfung vorzeitig beenden: Die restlichen Teile zählen mit 0 Punkten.
export async function endExamEarly(formData: FormData) {
  const profile = await requireCustomer();
  const attempt = await getAttempt(uuid.parse(formData.get("attempt_id")));
  if (!attempt || attempt.user_id !== profile.id) redirect("/app/exam");
  if (!attempt.finished_at) {
    const exam = await getExam(attempt.exam_id);
    const parts = exam ? await getExamParts(exam) : [];
    const supabase = await createClient();
    await supabase
      .from("exam_attempts")
      .update({ ...autoResults(parts, attempt.answers), current_part: parts.length, finished_at: new Date().toISOString() })
      .eq("id", attempt.id);
  }
  revalidatePath("/app/exam", "layout");
  redirect(`/app/exam/attempt/${attempt.id}`);
}

// --- GWS: Prüfungen verwalten und bewerten -----------------------------------

export type ExamState = { error?: string; success?: string } | undefined;

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50) || "pruefung"
  );
}

export async function createExam(_prev: ExamState, formData: FormData): Promise<ExamState> {
  await requireStaff();
  const title = z.string().trim().min(1).max(200).safeParse(formData.get("title_de"));
  if (!title.success) return { error: "invalid" };
  const supabase = await createClient();
  const slug = `${slugify(title.data)}-${Date.now().toString(36)}`;
  // Das Modul hält die Prüfungsteile und bleibt unveröffentlicht (nicht in der normalen Modulliste).
  const { data: mod, error: modError } = await supabase
    .from("modules")
    .insert({ slug, title_de: `${title.data} – Prüfungsteile`, title_en: "", sort: 900, published: false })
    .select("id")
    .single();
  if (modError || !mod) return { error: "generic" };
  const { data, error } = await supabase.from("exams").insert({ module_id: mod.id, slug, title_de: title.data }).select("id").single();
  if (error || !data) return { error: "generic" };
  revalidatePath("/admin/exams");
  redirect(`/admin/exams/${data.id}`);
}

const examSchema = z.object({
  id: uuid,
  title_de: z.string().trim().min(1).max(200),
  title_en: z.string().trim().max(200).default(""),
  description_de: z.string().trim().max(3000).default(""),
  description_en: z.string().trim().max(3000).default(""),
  pass_percent: z.coerce.number().int().min(0).max(100),
  sort: z.coerce.number().int().min(0).max(9999).default(0),
  published: z.preprocess((v) => v === "on" || v === "true", z.boolean()),
});

export async function updateExam(_prev: ExamState, formData: FormData): Promise<ExamState> {
  await requireStaff();
  const parsed = examSchema.safeParse({ ...Object.fromEntries(formData), published: formData.get("published") });
  if (!parsed.success) return { error: "invalid" };
  const { id, ...rest } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("exams").update(rest).eq("id", id);
  if (error) return { error: "generic" };
  revalidatePath("/admin/exams", "layout");
  revalidatePath("/app/exam", "layout");
  return { success: "saved" };
}

export async function saveExamReview(_prev: ExamState, formData: FormData): Promise<ExamState> {
  const staff = await requireStaff();
  const attempt = await getAttempt(uuid.parse(formData.get("attempt_id")));
  if (!attempt) return { error: "generic" };
  const exam = await getExam(attempt.exam_id);
  const parts = exam ? await getExamParts(exam, true) : [];

  const points: Record<string, number> = { ...attempt.staff_points };
  for (const lesson of parts.filter(isManual)) {
    const raw = formData.get(`points_${lesson.id}`);
    if (raw === null || raw === "") {
      delete points[lesson.id];
      continue;
    }
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 0 || n > partMax(lesson)) return { error: "points" };
    points[lesson.id] = n;
  }
  const comment = String(formData.get("comment") ?? "").trim().slice(0, 5000);

  const supabase = await createClient();
  const { error } = await supabase
    .from("exam_attempts")
    .update({ staff_points: points, staff_comment: comment || null, reviewed_by: staff.id, reviewed_at: new Date().toISOString() })
    .eq("id", attempt.id);
  if (error) return { error: "generic" };

  // Gerade bestanden (vorher noch nicht): Kunde bekommt Bescheid, dass das Zertifikat bereitliegt.
  if (exam && attempt.finished_at) {
    const published = parts.filter((l) => l.published);
    const before = summarize(attempt, published, exam.pass_percent).passed;
    const after = summarize({ ...attempt, staff_points: points }, published, exam.pass_percent).passed;
    if (after === true && before !== true) await notifyCertificate(attempt.user_id, attempt.id).catch(() => undefined);
  }
  revalidatePath("/admin/exams", "layout");
  revalidatePath("/app/exam", "layout");
  return { success: "saved" };
}

export async function deleteAttempt(formData: FormData) {
  await requireStaff();
  const id = uuid.parse(formData.get("attempt_id"));
  const supabase = await createClient();
  await supabase.from("exam_attempts").delete().eq("id", id);
  revalidatePath("/admin/exams", "layout");
  redirect("/admin/exams");
}

async function notifyCertificate(userId: string, attemptId: string) {
  const supabase = await createClient();
  const { data: customer } = await supabase.from("profiles").select("email, first_name, locale").eq("id", userId).maybeSingle();
  if (!customer) return;
  const url = `/app/exam/attempt/${attemptId}`;
  const tp = await getTranslations({ locale: customer.locale, namespace: "push" });
  await sendPush([userId], { title: tp("certificateTitle"), body: tp("certificateBody"), url, tag: `exam-${attemptId}` }).catch(() => 0);
  const t = await getTranslations({ locale: customer.locale, namespace: "mail" });
  await sendMail({
    to: customer.email,
    subject: t("certificateSubject"),
    text: t("certificateBody", { name: customer.first_name || customer.email, link: `${siteUrl()}${url}` }),
  });
}
