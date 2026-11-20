import type { Question } from "@/lib/types";

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ").replace(/[.!?,;:]$/, "");
}

// Gemeinsame Auswertung für Übungen (im Browser) und Prüfungen (auf dem Server).
export function isCorrect(q: Question, answer: string | number | undefined | null) {
  if (answer === undefined || answer === null || answer === "") return false;
  if (q.type === "mc") return answer === q.answer;
  const given = normalize(String(answer));
  return [q.answer, ...(q.alternatives ?? [])].some((a) => normalize(a) === given);
}
