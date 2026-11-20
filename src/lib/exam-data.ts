import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Lesson } from "@/lib/types";
import type { Exam, ExamAttempt } from "@/lib/exam";

export async function getExams(): Promise<Exam[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("exams").select("*").order("sort").order("title_de");
  return (data as Exam[]) ?? [];
}

export async function getExam(id: string): Promise<Exam | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("exams").select("*").eq("id", id).maybeSingle();
  return (data as Exam | null) ?? null;
}

// Prüfungsteile = veröffentlichte Lektionen des Prüfungsmoduls in ihrer Reihenfolge.
export async function getExamParts(exam: Pick<Exam, "module_id">, includeDrafts = false): Promise<Lesson[]> {
  const supabase = await createClient();
  let query = supabase.from("lessons").select("*").eq("module_id", exam.module_id).order("sort").order("title_de");
  if (!includeDrafts) query = query.eq("published", true);
  const { data } = await query;
  return (data as Lesson[]) ?? [];
}

export async function getAttempt(id: string): Promise<ExamAttempt | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("exam_attempts").select("*").eq("id", id).maybeSingle();
  return (data as ExamAttempt | null) ?? null;
}

export async function getAttempts(filter: { userId?: string; examId?: string; limit?: number } = {}): Promise<ExamAttempt[]> {
  const supabase = await createClient();
  let query = supabase.from("exam_attempts").select("*").order("started_at", { ascending: false }).limit(filter.limit ?? 200);
  if (filter.userId) query = query.eq("user_id", filter.userId);
  if (filter.examId) query = query.eq("exam_id", filter.examId);
  const { data } = await query;
  return (data as ExamAttempt[]) ?? [];
}
