"use client";

import { useTranslations } from "next-intl";
import type { GlossaryTerm } from "@/lib/types";
import { PronounceButtons } from "./Pronounce";

// Farben für die Artikel helfen beim Merken (der = blau, die = rot, das = grün).
export const ARTICLE_COLORS: Record<string, string> = {
  der: "text-accent",
  die: "text-danger",
  das: "text-success",
};

export function termLabel(t: Pick<GlossaryTerm, "article" | "term">) {
  return [t.article, t.term].filter(Boolean).join(" ");
}

export function TermHeading({ term, className = "" }: { term: Pick<GlossaryTerm, "article" | "term">; className?: string }) {
  return (
    <span className={className}>
      {term.article && <span className={`${ARTICLE_COLORS[term.article] ?? ""} mr-1.5`}>{term.article}</span>}
      {term.term}
    </span>
  );
}

export function TermCard({ term, topicLabel, status }: { term: GlossaryTerm; topicLabel?: string; status?: "known" | "learning" }) {
  const t = useTranslations("glossary");

  return (
    <article className="card space-y-1.5 p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold text-primary">
          <TermHeading term={term} />
        </h3>
        <div className="flex shrink-0 items-center gap-2">
          {status && (
            <span className={`badge ${status === "known" ? "bg-success-light text-success" : "bg-accent-light text-accent"}`}>
              {status === "known" ? t("statusKnown") : t("statusLearning")}
            </span>
          )}
          <PronounceButtons term={term} withExample />
        </div>
      </div>
      {term.plural && <p className="text-sm text-muted">{t("plural")}: {term.plural}</p>}
      {term.explanation && <p className="text-sm text-ink">{term.explanation}</p>}
      {term.en && <p className="text-sm font-semibold text-accent">🇬🇧 {term.en}</p>}
      {term.example && <p className="text-sm italic text-muted">„{term.example}“</p>}
      {topicLabel && <p className="pt-1 text-xs font-semibold text-muted">{topicLabel}</p>}
    </article>
  );
}
