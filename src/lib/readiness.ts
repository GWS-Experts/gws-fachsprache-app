import type { Lesson, LessonKind } from "@/lib/types";

// Prüfungsbereitschaft eines Kunden, berechnet aus Lernfortschritt und Abgaben.
// Bewusst einfache, nachvollziehbare Regeln, damit GWS die Ampel versteht.

export const EXAM_PARTS: LessonKind[] = ["listening", "reading", "writing", "speaking"];
export type ReadinessStatus = "ready" | "onTrack" | "behind" | "inactive";
export type ReadinessReason = "idle" | "neverStarted" | "lowScore" | "manyWeak" | "lessonsMissing" | "partsMissing";

export const READY_MIN_PERCENT = 80; // Anteil erledigter Lektionen
export const READY_MIN_SCORE = 75; // Ø Ergebnis in Übungen
export const BEHIND_MAX_SCORE = 60;
export const INACTIVE_DAYS = 14;

type ProgressRow = { user_id: string; lesson_id: string; score: number; max_score: number; completed_at: string };
type SubmissionRow = { user_id: string; lesson_id: string; feedback: string | null; created_at: string };

export interface PartStat {
  kind: LessonKind;
  total: number;
  done: number;
  percent: number;
  scorePercent: number | null;
}

export interface Readiness {
  status: ReadinessStatus;
  score: number; // 0–100, Mischung aus Fortschritt und Ergebnis
  percent: number;
  avgScore: number | null;
  parts: PartStat[];
  lastActivity: string | null;
  openSubmissions: number;
  weakLessons: number;
  reasons: ReadinessReason[]; // Schlüssel für Übersetzungen (customers.reasons.*)
}

export function computeReadiness(
  lessons: Lesson[],
  progress: ProgressRow[],
  submissions: SubmissionRow[],
  now = new Date(),
): Readiness {
  const lessonById = new Map(lessons.map((l) => [l.id, l]));
  const doneIds = new Set(progress.map((p) => p.lesson_id));

  // Bestes Ergebnis pro Lektion (nur bewertete Übungen)
  const best = new Map<string, number>();
  for (const p of progress) {
    if (p.max_score <= 0) continue;
    const pct = (p.score / p.max_score) * 100;
    best.set(p.lesson_id, Math.max(best.get(p.lesson_id) ?? 0, pct));
  }
  const bestVisible = [...best.entries()].filter(([id]) => lessonById.has(id)).map(([, pct]) => pct);
  const avgScore = bestVisible.length ? Math.round(bestVisible.reduce((a, b) => a + b, 0) / bestVisible.length) : null;
  const weakLessons = bestVisible.filter((pct) => pct < 70).length;

  const done = lessons.filter((l) => doneIds.has(l.id)).length;
  const percent = lessons.length ? Math.round((done / lessons.length) * 100) : 0;

  const parts = EXAM_PARTS.map((kind) => {
    const ls = lessons.filter((l) => l.kind === kind);
    const d = ls.filter((l) => doneIds.has(l.id)).length;
    const scores = ls.map((l) => best.get(l.id)).filter((v): v is number => v !== undefined);
    return {
      kind,
      total: ls.length,
      done: d,
      percent: ls.length ? Math.round((d / ls.length) * 100) : 0,
      scorePercent: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
    };
  });

  const dates = [...progress.map((p) => p.completed_at), ...submissions.map((s) => s.created_at)];
  const lastActivity = dates.reduce<string | null>((acc, d) => (!acc || d > acc ? d : acc), null);
  const daysIdle = lastActivity ? (now.getTime() - new Date(lastActivity).getTime()) / 86_400_000 : Infinity;
  const openSubmissions = submissions.filter((s) => !s.feedback).length;

  const missingParts = parts.filter((p) => p.total > 0 && p.done === 0);
  const reasons: ReadinessReason[] = [];
  let status: ReadinessStatus;

  if (percent >= READY_MIN_PERCENT && (avgScore ?? 0) >= READY_MIN_SCORE && missingParts.length === 0) {
    status = "ready";
  } else if (daysIdle > INACTIVE_DAYS) {
    status = "inactive";
    reasons.push(lastActivity ? "idle" : "neverStarted");
  } else if ((avgScore !== null && avgScore < BEHIND_MAX_SCORE) || weakLessons >= 3) {
    status = "behind";
    if (avgScore !== null && avgScore < BEHIND_MAX_SCORE) reasons.push("lowScore");
    if (weakLessons >= 3) reasons.push("manyWeak");
  } else {
    status = "onTrack";
  }
  if (status !== "ready") {
    if (percent < READY_MIN_PERCENT) reasons.push("lessonsMissing");
    if (missingParts.length) reasons.push("partsMissing");
  }

  const score = Math.round(0.6 * percent + 0.4 * (avgScore ?? 0));
  return { status, score, percent, avgScore, parts, lastActivity, openSubmissions, weakLessons, reasons };
}
