import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Lesson, LessonKind, Module, Progress, Submission } from "@/lib/types";

export async function getModules(): Promise<Module[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("modules").select("*").order("sort").order("title_de");
  return (data as Module[]) ?? [];
}

export async function getLessons(moduleId?: string): Promise<Lesson[]> {
  const supabase = await createClient();
  let query = supabase.from("lessons").select("*").order("sort").order("title_de");
  if (moduleId) query = query.eq("module_id", moduleId);
  const { data } = await query;
  return (data as Lesson[]) ?? [];
}

export interface ModuleStat {
  module: Module;
  total: number;
  done: number;
  percent: number;
}

export interface KindStat {
  kind: LessonKind;
  attempts: number;
  scorePercent: number | null;
}

export interface LearningStats {
  totalLessons: number;
  doneLessons: number;
  percent: number;
  avgScore: number | null;
  totalSeconds: number;
  lastActivity: string | null;
  modules: ModuleStat[];
  kinds: KindStat[];
  recent: (Progress & { lesson?: Lesson })[];
  submissions: (Submission & { lesson?: Lesson })[];
  weakLessons: { lesson: Lesson; percent: number }[];
}

// Fortschritt eines Kunden. Für Kunden liefert RLS nur die eigenen Zeilen,
// GWS-Mitarbeiter dürfen jeden Kunden abfragen.
export async function getLearningStats(userId: string, publishedOnly = true): Promise<LearningStats> {
  const supabase = await createClient();
  const [modules, lessons, progressRes, submissionsRes] = await Promise.all([
    getModules(),
    getLessons(),
    supabase.from("progress").select("*").eq("user_id", userId).order("completed_at", { ascending: false }),
    supabase.from("submissions").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
  ]);
  const progress = (progressRes.data as Progress[]) ?? [];
  const submissions = (submissionsRes.data as Submission[]) ?? [];

  const visibleModules = modules.filter((m) => !publishedOnly || m.published);
  const moduleIds = new Set(visibleModules.map((m) => m.id));
  const visibleLessons = lessons.filter((l) => moduleIds.has(l.module_id) && (!publishedOnly || l.published));
  const lessonById = new Map(lessons.map((l) => [l.id, l]));
  const doneIds = new Set(progress.map((p) => p.lesson_id));

  const scored = progress.filter((p) => p.max_score > 0);
  const avgScore = scored.length ? Math.round((scored.reduce((s, p) => s + p.score / p.max_score, 0) / scored.length) * 100) : null;

  const moduleStats = visibleModules.map((module) => {
    const ls = visibleLessons.filter((l) => l.module_id === module.id);
    const done = ls.filter((l) => doneIds.has(l.id)).length;
    return { module, total: ls.length, done, percent: ls.length ? Math.round((done / ls.length) * 100) : 0 };
  });

  const kinds = (["reading", "listening", "vocabulary", "quiz", "dialogue", "writing", "speaking"] as LessonKind[]).map((kind) => {
    const rows = progress.filter((p) => lessonById.get(p.lesson_id)?.kind === kind);
    const s = rows.filter((p) => p.max_score > 0);
    return {
      kind,
      attempts: rows.length,
      scorePercent: s.length ? Math.round((s.reduce((a, p) => a + p.score / p.max_score, 0) / s.length) * 100) : null,
    };
  });

  // Bestes Ergebnis pro Lektion; unter 70 % gilt als Thema zum Wiederholen.
  const best = new Map<string, number>();
  for (const p of scored) {
    const pct = Math.round((p.score / p.max_score) * 100);
    best.set(p.lesson_id, Math.max(best.get(p.lesson_id) ?? 0, pct));
  }
  const weakLessons = [...best.entries()]
    .filter(([, pct]) => pct < 70)
    .map(([id, percent]) => ({ lesson: lessonById.get(id)!, percent }))
    .filter((w) => w.lesson)
    .sort((a, b) => a.percent - b.percent);

  const doneLessons = visibleLessons.filter((l) => doneIds.has(l.id)).length;
  return {
    totalLessons: visibleLessons.length,
    doneLessons,
    percent: visibleLessons.length ? Math.round((doneLessons / visibleLessons.length) * 100) : 0,
    avgScore,
    totalSeconds: progress.reduce((s, p) => s + p.duration_seconds, 0),
    lastActivity: progress[0]?.completed_at ?? submissions[0]?.created_at ?? null,
    modules: moduleStats,
    kinds,
    recent: progress.slice(0, 10).map((p) => ({ ...p, lesson: lessonById.get(p.lesson_id) })),
    submissions: submissions.map((s) => ({ ...s, lesson: lessonById.get(s.lesson_id) })),
    weakLessons,
  };
}

export function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h ? `${h} h ${m} min` : `${m} min`;
}
