import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { Lesson } from "@/lib/types";

// KI-Korrekturvorschläge für Schreibaufgaben. Der Vorschlag wird nie direkt
// an Kunden gegeben: GWS prüft ihn, passt ihn an und gibt ihn frei.

export const AI_MODEL = "claude-opus-5-5";

export function aiConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const SYSTEM = `Du bist erfahrene Prüferin für die Fachsprachprüfung Pflege (Niveau B2, Deutsch) und unterstützt das Team von GWS.
Du korrigierst Schreibaufgaben internationaler Pflegefachkräfte. Dein Text ist ein Entwurf: Eine GWS-Mitarbeiterin prüft ihn, bevor die Pflegekraft ihn sieht.

Schreibe das Feedback direkt an die Pflegekraft (Du-Form), freundlich, konkret und ermutigend, in einfachem Deutsch (B1/B2).
Gliedere so, ohne Markdown-Zeichen wie # oder **, nur mit diesen Überschriften und Spiegelstrichen "- ":

Gesamteindruck:
(2 bis 3 Sätze: Ist die Aufgabe erfüllt? Was gelingt schon gut?)

Korrekturen:
(die wichtigsten Fehler, höchstens 8, jeweils: - "Originalstelle" → "Korrektur" (kurze Erklärung). Grammatik, Rechtschreibung, Wortwahl.)

Fachsprache und Stil:
(Pflegefachbegriffe, sachlicher Dokumentationsstil, Struktur, Vollständigkeit der Inhaltspunkte)

Tipp für die Prüfung:
(ein konkreter Tipp)

Einschätzung: (eine Zeile: "prüfungsreif", "fast prüfungsreif" oder "noch üben", mit einem kurzen Grund)

Erfinde keine Inhalte, die nicht im Text stehen. Wenn der Text sehr kurz oder leer ist, sag das freundlich.`;

export async function generateFeedbackDraft({ lesson, text }: { lesson?: Lesson; text: string }): Promise<string | null> {
  if (!aiConfigured()) return null;
  const client = new Anthropic();

  const task = [
    lesson ? `Lektion: ${lesson.title_de}` : "",
    lesson?.content.task_de ? `Aufgabe:\n${lesson.content.task_de}` : "",
    lesson?.content.hints?.length ? `Inhaltspunkte:\n${lesson.content.hints.map((h) => `- ${h}`).join("\n")}` : "",
    lesson?.content.min_words ? `Mindestlänge: ${lesson.content.min_words} Wörter` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const response = await client.beta.messages.create({
      model: AI_MODEL,
      max_tokens: 16000,
      output_config: { effort: "medium" },
      // Falls das Modell ablehnt, übernimmt automatisch ein passendes Ersatzmodell.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `${task || "Freie Schreibaufgabe"}\n\nText der Pflegekraft:\n<text>\n${text}\n</text>`,
        },
      ],
    });
    if (response.stop_reason === "refusal") return null;
    const out = response.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();
    return out || null;
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      console.error("KI-Korrektur: ANTHROPIC_API_KEY ist ungültig.");
    } else if (error instanceof Anthropic.RateLimitError) {
      console.error("KI-Korrektur: Limit erreicht, später erneut versuchen.");
    } else if (error instanceof Anthropic.APIError) {
      console.error(`KI-Korrektur: API-Fehler ${error.status}`, error.message);
    } else {
      console.error("KI-Korrektur fehlgeschlagen", error);
    }
    return null;
  }
}
