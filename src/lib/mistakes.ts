import type { Question } from "@/lib/types";

// Fehlertrainer: gemeinsame Typen und Hilfsfunktionen für Browser und Server.

export type MistakeSource = "lesson" | "exam" | "writing";

export interface Mistake {
  id: string;
  user_id: string;
  item_key: string;
  source: MistakeSource;
  lesson_id: string | null;
  submission_id: string | null;
  question: Question;
  wrong_count: number;
  right_streak: number;
  last_wrong_at: string;
  last_practiced_at: string | null;
  mastered_at: string | null;
  created_at: string;
}

// So oft hintereinander richtig, dann gilt ein Fehler als sicher.
export const MASTERY_STREAK = 2;
// So viele Fehler pro Trainingsrunde.
export const SESSION_SIZE = 10;

export const questionKey = (lessonId: string, index: number) => `q:${lessonId}:${index}`;

// Kleiner, stabiler Hash (FNV-1a) für Schlüssel aus Text.
export function hashText(s: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

export interface Correction {
  wrong: string;
  right: string;
  explanation?: string;
}

const QUOTES = /^[\s"'„“”‚‘’»«›‹]+|[\s"'„“”‚‘’»«›‹]+$/g;
const unquote = (s: string) => s.replace(QUOTES, "").trim();

// Liest die Korrekturen aus einem Feedback-Text. Erwartetes Format (wie im KI-Vorschlag):
//   - "Originalstelle" → "Korrektur" (kurze Erklärung)
// Zeilen ohne Pfeil werden ignoriert.
export function parseCorrections(feedback: string): Correction[] {
  const out: Correction[] = [];
  const seen = new Set<string>();
  for (const raw of feedback.split(/\r?\n/)) {
    const line = raw.replace(/^\s*(?:[-–•*]|\d+[.)])\s*/, "").trim();
    const m = line.match(/^(.+?)\s*(?:→|->|=>|⇒)\s*(.+)$/);
    if (!m) continue;
    let right = m[2].trim();
    let explanation: string | undefined;
    const paren = right.match(/^(.*?)\s*\(([^()]+)\)\s*\.?$/);
    if (paren && paren[1].trim()) {
      right = paren[1];
      explanation = paren[2].trim();
    }
    const wrong = unquote(m[1]);
    right = unquote(right);
    if (!wrong || !right || wrong === right) continue;
    if (wrong.length > 160 || right.length > 160) continue;
    const key = `${wrong}→${right}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ wrong, right, explanation });
  }
  return out;
}

// Aus einer Korrektur wird eine Auswahlfrage: "Welche Form ist richtig?"
// Die Reihenfolge der beiden Antworten ist zufällig, aber pro Korrektur fest.
export function correctionQuestion(c: Correction, prompt: string): Question {
  const rightFirst = parseInt(hashText(c.wrong + c.right), 36) % 2 === 0;
  return {
    type: "mc",
    prompt,
    options: rightFirst ? [c.right, c.wrong] : [c.wrong, c.right],
    answer: rightFirst ? 0 : 1,
    explanation: c.explanation,
  };
}
