import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isCorrect } from "@/lib/questions";
import { MASTERY_STREAK, SESSION_SIZE, correctionQuestion, hashText, parseCorrections, questionKey, type Mistake, type MistakeSource } from "@/lib/mistakes";
import type { Lesson } from "@/lib/types";

type Client = Awaited<ReturnType<typeof createClient>>;
type AnswerValue = string | number | null | undefined;

// Ergebnisse einer Übung oder eines Prüfungsteils in den Fehlertrainer übernehmen:
// falsche Antworten werden gesammelt (oder erneut gezählt), richtige Antworten auf
// bereits gesammelte Fehler zählen als Fortschritt. Fehler hier dürfen die Übung nie stören.
export async function recordQuestionResults(supabase: Client, userId: string, lesson: Lesson, answers: AnswerValue[], source: Exclude<MistakeSource, "writing">) {
  try {
    const questions = lesson.content?.questions ?? [];
    if (questions.length === 0) return;
    const results = questions.map((q, i) => ({ q, i, key: questionKey(lesson.id, i), ok: isCorrect(q, answers[i]) }));

    const { data, error } = await supabase
      .from("mistakes")
      .select("id, item_key, wrong_count, right_streak, mastered_at")
      .eq("user_id", userId)
      .in("item_key", results.map((r) => r.key));
    if (error) return;
    const existing = new Map((data ?? []).map((m) => [m.item_key as string, m as Pick<Mistake, "id" | "wrong_count" | "right_streak" | "mastered_at">]));
    const now = new Date().toISOString();

    const inserts = results
      .filter((r) => !r.ok && !existing.has(r.key))
      .map((r) => ({ item_key: r.key, source, lesson_id: lesson.id, question: r.q, last_wrong_at: now }));
    if (inserts.length) await supabase.from("mistakes").insert(inserts);

    await Promise.all(
      results.map((r) => {
        const m = existing.get(r.key);
        if (!m) return null;
        if (!r.ok) {
          return supabase
            .from("mistakes")
            .update({ question: r.q, wrong_count: m.wrong_count + 1, right_streak: 0, mastered_at: null, last_wrong_at: now })
            .eq("id", m.id);
        }
        if (m.mastered_at) return null;
        const streak = m.right_streak + 1;
        return supabase
          .from("mistakes")
          .update({ right_streak: streak, mastered_at: streak >= MASTERY_STREAK ? now : null })
          .eq("id", m.id);
      }),
    );
  } catch (error) {
    console.error("Fehlertrainer: Ergebnisse konnten nicht gespeichert werden", error);
  }
}

const WRITING_PROMPT = "Aus deinem Text – welche Form ist richtig?";

// Korrekturen aus freigegebenem Feedback zu eigenen Texten übernehmen.
// Bereits übernommene Korrekturen bleiben unverändert (auch ihr Lernstand).
export async function syncWritingMistakes(supabase: Client, userId: string) {
  try {
    const { data } = await supabase
      .from("submissions")
      .select("id, lesson_id, feedback")
      .eq("user_id", userId)
      .not("feedback", "is", null)
      .not("text", "is", null);
    const rows = (data ?? []).flatMap((s) =>
      parseCorrections(String(s.feedback)).map((c) => ({
        item_key: `w:${s.id}:${hashText(`${c.wrong}→${c.right}`)}`,
        source: "writing" as const,
        lesson_id: s.lesson_id as string,
        submission_id: s.id as string,
        question: correctionQuestion(c, WRITING_PROMPT),
      })),
    );
    if (rows.length) await supabase.from("mistakes").upsert(rows, { onConflict: "user_id,item_key", ignoreDuplicates: true });
  } catch (error) {
    console.error("Fehlertrainer: Korrekturen konnten nicht übernommen werden", error);
  }
}

export interface MistakeOverview {
  available: boolean; // false, solange die Tabelle noch nicht angelegt ist
  open: Mistake[];
  masteredCount: number;
  lessonTitles: Record<string, { de: string; en: string }>;
}

// Alle Fehler einer Person; offene zuerst die, die am längsten nicht geübt wurden und am häufigsten falsch waren.
export async function getMistakeOverview(userId: string, { sync = false } = {}): Promise<MistakeOverview> {
  const supabase = await createClient();
  if (sync) await syncWritingMistakes(supabase, userId);
  const [{ data, error }, { count }] = await Promise.all([
    supabase.from("mistakes").select("*").eq("user_id", userId).is("mastered_at", null).limit(500),
    supabase.from("mistakes").select("id", { count: "exact", head: true }).eq("user_id", userId).not("mastered_at", "is", null),
  ]);
  if (error) return { available: false, open: [], masteredCount: 0, lessonTitles: {} };

  const open = ((data ?? []) as Mistake[]).sort(
    (a, b) =>
      (a.last_practiced_at ?? "").localeCompare(b.last_practiced_at ?? "") ||
      b.wrong_count - a.wrong_count ||
      b.last_wrong_at.localeCompare(a.last_wrong_at),
  );
  const lessonIds = [...new Set(open.map((m) => m.lesson_id).filter((x): x is string => Boolean(x)))];
  const lessonTitles: MistakeOverview["lessonTitles"] = {};
  if (lessonIds.length) {
    const { data: lessons } = await supabase.from("lessons").select("id, title_de, title_en").in("id", lessonIds);
    for (const l of lessons ?? []) lessonTitles[l.id] = { de: l.title_de, en: l.title_en || l.title_de };
  }
  return { available: true, open, masteredCount: count ?? 0, lessonTitles };
}

export const nextSession = (open: Mistake[]) => open.slice(0, SESSION_SIZE);
