import type { Lesson, LessonKind } from "@/lib/types";
import { isCorrect } from "@/lib/questions";

// Probeprüfung: gemeinsame Typen und Auswertung für Browser und Server.

export interface Exam {
  id: string;
  module_id: string;
  slug: string;
  title_de: string;
  title_en: string;
  description_de: string;
  description_en: string;
  pass_percent: number;
  sort: number;
  published: boolean;
}

export type AnswerValue = string | number | null;

export interface PartAnswer {
  answers?: AnswerValue[];
  text?: string;
  audio_path?: string | null;
  submission_id?: string | null;
  seconds?: number;
  timed_out?: boolean;
}

export interface ExamAttempt {
  id: string;
  user_id: string;
  exam_id: string;
  started_at: string;
  finished_at: string | null;
  current_part: number;
  part_started_at: string;
  answers: Record<string, PartAnswer>;
  results: unknown;
  score: number;
  max_score: number;
  staff_points: Record<string, number>;
  staff_comment: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

export type ExamArea = "reading" | "language" | "listening" | "writing" | "speaking";
export const EXAM_AREAS: ExamArea[] = ["reading", "language", "listening", "writing", "speaking"];

const AREA_BY_KIND: Record<LessonKind, ExamArea> = {
  reading: "reading",
  quiz: "language",
  vocabulary: "language",
  listening: "listening",
  dialogue: "listening",
  writing: "writing",
  speaking: "speaking",
};

const DEFAULT_MINUTES: Record<LessonKind, number> = {
  reading: 20,
  quiz: 15,
  vocabulary: 10,
  listening: 10,
  dialogue: 10,
  writing: 30,
  speaking: 5,
};

// Übungstyp, zu dem Kunden nach der Prüfung zum Wiederholen geschickt werden.
export const PRACTICE_KINDS: Record<ExamArea, LessonKind[]> = {
  reading: ["reading"],
  language: ["quiz", "vocabulary"],
  listening: ["listening", "dialogue"],
  writing: ["writing"],
  speaking: ["speaking", "dialogue"],
};

export const areaOf = (lesson: Pick<Lesson, "kind">): ExamArea => AREA_BY_KIND[lesson.kind];
export const isManual = (lesson: Pick<Lesson, "kind">) => lesson.kind === "writing" || lesson.kind === "speaking";
export const isOral = (area: ExamArea) => area === "speaking";

export function partMinutes(lesson: Pick<Lesson, "kind" | "content">) {
  const m = lesson.content?.time_minutes;
  return m && m > 0 ? m : DEFAULT_MINUTES[lesson.kind];
}

export function partMax(lesson: Pick<Lesson, "kind" | "content">) {
  if (isManual(lesson)) return lesson.content?.max_points && lesson.content.max_points > 0 ? lesson.content.max_points : 10;
  return lesson.content?.questions?.length ?? 0;
}

export function autoScore(lesson: Lesson, answer: PartAnswer | undefined) {
  const qs = lesson.content?.questions ?? [];
  const given = answer?.answers ?? [];
  return qs.filter((q, i) => isCorrect(q, given[i] ?? undefined)).length;
}

export interface PartResult {
  lesson: Lesson;
  area: ExamArea;
  score: number | null; // null = Bewertung durch GWS steht noch aus
  max: number;
  seconds: number;
  limitSeconds: number;
  answer: PartAnswer | undefined;
  timedOut: boolean;
}

export interface Bucket {
  score: number;
  max: number;
  pending: boolean;
  percent: number | null;
}

export interface ExamSummary {
  parts: PartResult[];
  areas: (Bucket & { area: ExamArea })[];
  written: Bucket;
  oral: Bucket;
  total: Bucket;
  pending: boolean;
  passed: boolean | null; // null = noch nicht vollständig bewertet
  seconds: number;
}

function bucket(parts: PartResult[]): Bucket {
  const max = parts.reduce((s, p) => s + p.max, 0);
  const score = parts.reduce((s, p) => s + (p.score ?? 0), 0);
  const pending = parts.some((p) => p.score === null);
  return { score, max, pending, percent: max ? Math.round((score / max) * 100) : null };
}

export function summarize(attempt: Pick<ExamAttempt, "answers" | "staff_points">, lessons: Lesson[], passPercent: number): ExamSummary {
  const parts: PartResult[] = lessons.map((lesson) => {
    const answer = attempt.answers?.[lesson.id];
    const manual = isManual(lesson);
    const staff = attempt.staff_points?.[lesson.id];
    const max = partMax(lesson);
    let score: number | null;
    if (!manual) score = autoScore(lesson, answer);
    else if (!answer?.submission_id) score = 0; // nichts abgegeben
    else score = typeof staff === "number" ? Math.min(staff, max) : null;
    return {
      lesson,
      area: areaOf(lesson),
      score,
      max,
      seconds: answer?.seconds ?? 0,
      limitSeconds: partMinutes(lesson) * 60,
      answer,
      timedOut: Boolean(answer?.timed_out),
    };
  });

  const areas = EXAM_AREAS.map((area) => ({ area, ...bucket(parts.filter((p) => p.area === area)) })).filter((a) => a.max > 0);
  const written = bucket(parts.filter((p) => !isOral(p.area)));
  const oral = bucket(parts.filter((p) => isOral(p.area)));
  const total = bucket(parts);
  const pending = total.pending;
  const ok = (b: Bucket) => b.max === 0 || (b.percent ?? 0) >= passPercent;
  return {
    parts,
    areas,
    written,
    oral,
    total,
    pending,
    passed: pending ? null : ok(written) && ok(oral),
    seconds: parts.reduce((s, p) => s + p.seconds, 0),
  };
}

export function totalMinutes(lessons: Pick<Lesson, "kind" | "content">[]) {
  return lessons.reduce((s, l) => s + partMinutes(l), 0);
}

export function formatClock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${r}` : `${m}:${r}`;
}
