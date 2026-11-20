import "server-only";
import { getGlossaryTerms } from "@/lib/glossary";
import { termsInTexts, type LinkedTerm } from "@/lib/term-matcher";
import type { Lesson } from "@/lib/types";

// Texte einer Lektion, in denen Fachbegriffe anklickbar sind. Fragen und Vokabelübungen
// bleiben bewusst ohne Links, sonst würde die Erklärung die Lösung verraten.
export function lessonTexts(lesson: Lesson): string[] {
  const c = lesson.content;
  return [c.intro_de, c.intro_en, c.task_de, c.task_en, c.text, c.transcript, ...(c.lines ?? []).map((l) => l.text)].filter(
    (s): s is string => typeof s === "string" && s.length > 0,
  );
}

// Nur die Fachbegriffe, die in der Lektion vorkommen, für den Browser aufbereitet.
export async function getLessonTerms(lesson: Lesson): Promise<LinkedTerm[]> {
  if (lesson.kind === "vocabulary" || lesson.kind === "quiz") return [];
  const texts = lessonTexts(lesson);
  if (texts.length === 0) return [];
  const terms = await getGlossaryTerms();
  const linked: LinkedTerm[] = terms.map((t) => ({
    id: t.id,
    article: t.article,
    term: t.term,
    plural: t.plural,
    explanation: t.explanation,
    en: t.en,
    example: t.example,
    has_audio: Boolean(t.audio_path),
  }));
  return termsInTexts(linked, texts);
}
