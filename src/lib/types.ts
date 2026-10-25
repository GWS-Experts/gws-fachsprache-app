export type Role = "customer" | "staff";
export type Locale = "de" | "en";
export type LessonKind = "reading" | "listening" | "vocabulary" | "quiz" | "dialogue" | "writing" | "speaking";

export const LESSON_KINDS: LessonKind[] = ["reading", "listening", "vocabulary", "quiz", "dialogue", "writing", "speaking"];

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: Role;
  locale: Locale;
  created_at: string;
}

export interface Module {
  id: string;
  slug: string;
  title_de: string;
  title_en: string;
  description_de: string;
  description_en: string;
  sort: number;
  published: boolean;
}

export interface Lesson {
  id: string;
  module_id: string;
  kind: LessonKind;
  title_de: string;
  title_en: string;
  content: LessonContent;
  sort: number;
  published: boolean;
}

export type Question =
  | { type: "mc"; prompt: string; options: string[]; answer: number; explanation?: string }
  | { type: "gap"; prompt: string; answer: string; alternatives?: string[]; explanation?: string };

export interface VocabItem {
  term: string;
  article?: string;
  plural?: string;
  en: string;
  example?: string;
}

export interface DialogueLine {
  speaker: string;
  text: string;
}

// Ein gemeinsames Format für alle Übungstypen; jeder Typ nutzt nur seine Felder.
export interface LessonContent {
  intro_de?: string;
  intro_en?: string;
  text?: string;
  transcript?: string;
  audio_path?: string | null;
  lines?: DialogueLine[];
  items?: VocabItem[];
  questions?: Question[];
  task_de?: string;
  task_en?: string;
  hints?: string[];
  min_words?: number;
  max_seconds?: number;
}

export interface Progress {
  id: string;
  user_id: string;
  lesson_id: string;
  score: number;
  max_score: number;
  duration_seconds: number;
  completed_at: string;
}

export interface Submission {
  id: string;
  user_id: string;
  lesson_id: string;
  text: string | null;
  audio_path: string | null;
  feedback: string | null;
  feedback_by: string | null;
  feedback_at: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  customer_id: string;
  sender_id: string;
  lesson_id: string | null;
  body: string;
  read_at: string | null;
  created_at: string;
}

export function pick(row: object, field: string, locale: Locale): string {
  const r = row as Record<string, unknown>;
  const localized = r[`${field}_${locale}`];
  if (typeof localized === "string" && localized.trim()) return localized;
  const fallback = r[`${field}_de`];
  return typeof fallback === "string" ? fallback : "";
}
