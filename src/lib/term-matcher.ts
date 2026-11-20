// Findet Fachbegriffe aus dem Glossar in Lektionstexten (läuft auf Server und im Browser).
import type { GlossaryTerm } from "@/lib/types";

export type LinkedTerm = Pick<GlossaryTerm, "id" | "article" | "term" | "plural" | "explanation" | "en" | "example"> & {
  has_audio: boolean;
};

export type Segment = string | { text: string; term: LinkedTerm };

const ARTICLES = /^(der|die|das|den|dem|des)\s+/i;
// Häufige Endungen, damit auch „Patienten“ oder „Infusionen“ gefunden werden.
const NOUN_ENDINGS = ["ern", "en", "er", "es", "em", "e", "n", "s"];
const LETTER = "[\\p{L}\\p{N}]";

function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Alle Schreibweisen eines Begriffs: Grundform, Plural und bei Verben die Formen in Klammern,
// z. B. „einnehmen (nimmt ein, hat eingenommen)“ → einnehmen, eingenommen.
export function termForms(t: Pick<GlossaryTerm, "term" | "plural">): string[] {
  const forms = new Set<string>();
  const base = t.term
    .replace(/\s*\(([^)]*)\)\s*/g, (_, inner: string) => {
      for (const part of inner.split(",")) {
        const f = part.trim().replace(/^(hat|ist|sind|haben)\s+/i, "");
        if (f && !/\s/.test(f)) forms.add(f);
      }
      return " ";
    })
    .trim();
  for (const f of base.split(/\s+\/\s+/)) if (f.trim()) forms.add(f.trim());
  for (const p of t.plural.split(/[,/]/)) {
    const f = p.trim().replace(ARTICLES, "");
    if (f && f !== "–" && f !== "-") forms.add(f);
  }
  return [...forms].filter((f) => f.length >= 2);
}

// Abkürzungen und kurze Wörter (RR, BZ, i. v., Arm) nur in genau dieser Schreibweise.
function isStrict(form: string) {
  return form.length <= 3 || /[A-ZÄÖÜ].*[A-ZÄÖÜ]/.test(form) || /[\d.]/.test(form);
}

const squash = (s: string) => s.replace(/\s+/g, "");

export interface TermMatcher {
  regex: RegExp | null;
  lookup: (match: string) => LinkedTerm | undefined;
}

export function buildMatcher(terms: LinkedTerm[]): TermMatcher {
  const exact = new Map<string, LinkedTerm>();
  const loose = new Map<string, LinkedTerm>();
  const nouns = new Set<string>();
  const patterns: { pattern: string; len: number }[] = [];

  for (const term of terms) {
    for (const form of termForms(term)) {
      if (isStrict(form)) {
        const key = squash(form);
        if (exact.has(key)) continue;
        exact.set(key, term);
        patterns.push({ pattern: escape(form).replace(/\s+/g, "\\s?"), len: form.length });
      } else {
        const key = form.toLowerCase().replace(/\s+/g, " ");
        if (loose.has(key)) continue;
        loose.set(key, term);
        const noun = /^[A-ZÄÖÜ]/.test(form) && form.length >= 5 && !/\s/.test(form);
        if (noun) nouns.add(key);
        patterns.push({ pattern: escape(form).replace(/\s+/g, "\\s+") + (noun ? `(?:${NOUN_ENDINGS.join("|")})?` : ""), len: form.length });
      }
    }
  }
  if (patterns.length === 0) return { regex: null, lookup: () => undefined };

  // Längere Begriffe zuerst, damit „Blutdruckmessung“ vor „Blutdruck“ greift.
  patterns.sort((a, b) => b.len - a.len);
  const regex = new RegExp(`(?<!${LETTER})(?:${patterns.map((p) => p.pattern).join("|")})(?!${LETTER})`, "giu");

  // Die Regex sucht ohne Groß-/Kleinschreibung; hier wird genau geprüft.
  function lookup(match: string) {
    const strict = exact.get(squash(match));
    if (strict) return strict;
    const lower = match.toLowerCase().replace(/\s+/g, " ");
    const hit = loose.get(lower);
    if (hit) return hit;
    for (const end of NOUN_ENDINGS) {
      const stem = lower.slice(0, -end.length);
      if (lower.endsWith(end) && nouns.has(stem)) return loose.get(stem);
    }
    return undefined;
  }

  return { regex, lookup };
}

// Zerlegt einen Text in normale Stücke und verlinkte Fachbegriffe.
// Mit firstOnly wird jeder Begriff nur beim ersten Vorkommen verlinkt, damit der Text ruhig bleibt.
export function segmentText(text: string, matcher: TermMatcher, firstOnly = false): Segment[] {
  if (!matcher.regex || !text) return [text];
  const out: Segment[] = [];
  const seen = new Set<string>();
  let last = 0;
  for (const m of text.matchAll(matcher.regex)) {
    const term = matcher.lookup(m[0]);
    if (!term || (firstOnly && seen.has(term.id))) continue;
    seen.add(term.id);
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push({ text: m[0], term });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

// Nur die Begriffe, die in den Texten wirklich vorkommen (hält die Datenmenge für den Browser klein).
export function termsInTexts(terms: LinkedTerm[], texts: string[]): LinkedTerm[] {
  const matcher = buildMatcher(terms);
  const found = new Map<string, LinkedTerm>();
  for (const text of texts) {
    for (const seg of segmentText(text, matcher)) if (typeof seg !== "string") found.set(seg.term.id, seg.term);
  }
  return [...found.values()];
}
