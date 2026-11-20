"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { GlossaryTerm } from "@/lib/types";
import { ProgressBar } from "@/components/ProgressBar";
import { TermCard } from "./TermCard";

export interface BrowserTopic {
  id: string;
  icon: string;
  title: string;
  description: string;
  total: number;
  known: number;
}

// Kleinschreibung, ohne Akzente; Umlaute bleiben gleichwertig zu ae/oe/ue.
function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

const MAX_RESULTS = 60;

export function GlossaryBrowser({
  topics,
  terms,
  status,
}: {
  topics: BrowserTopic[];
  terms: GlossaryTerm[];
  status: Record<string, "known" | "learning">;
}) {
  const t = useTranslations("glossary");
  const [query, setQuery] = useState("");
  const topicTitle = useMemo(() => new Map(topics.map((tp) => [tp.id, `${tp.icon} ${tp.title}`])), [topics]);
  const index = useMemo(
    () => terms.map((term) => ({ term, head: normalize(term.term), rest: normalize([term.plural, term.explanation, term.en].join(" ")) })),
    [terms],
  );

  const q = normalize(query.trim());
  const results = useMemo(() => {
    if (q.length < 2) return [];
    // Treffer im Begriff selbst zuerst, dann in Erklärung und Übersetzung.
    const head = index.filter((e) => e.head.includes(q));
    const rest = index.filter((e) => !e.head.includes(q) && e.rest.includes(q));
    return [...head.sort((a, b) => Number(!a.head.startsWith(q)) - Number(!b.head.startsWith(q))), ...rest].map((e) => e.term);
  }, [index, q]);

  return (
    <div className="space-y-5">
      <div>
        <label className="label" htmlFor="glossary-search">{t("search")}</label>
        <input
          id="glossary-search"
          type="search"
          className="input"
          placeholder={t("searchPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
      </div>

      {q.length >= 2 ? (
        <section className="space-y-3" aria-live="polite">
          <p className="text-sm text-muted">{t("results", { count: results.length })}</p>
          <ul className="grid gap-3 md:grid-cols-2">
            {results.slice(0, MAX_RESULTS).map((term) => (
              <li key={term.id}>
                <TermCard term={term} topicLabel={topicTitle.get(term.topic_id)} status={status[term.id]} />
              </li>
            ))}
          </ul>
          {results.length > MAX_RESULTS && <p className="text-sm text-muted">{t("moreResults", { count: results.length - MAX_RESULTS })}</p>}
        </section>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((tp) => (
            <li key={tp.id}>
              <Link href={`/app/glossary/${tp.id}`} className="card flex h-full flex-col transition hover:border-primary hover:shadow-md">
                <h2 className="text-lg font-bold text-primary">
                  <span aria-hidden className="mr-2">{tp.icon}</span>
                  {tp.title}
                </h2>
                <p className="mt-1 flex-1 text-sm text-muted">{tp.description}</p>
                <p className="mt-4 text-xs font-semibold text-muted">{t("knownOf", { known: tp.known, total: tp.total })}</p>
                <div className="mt-1">
                  <ProgressBar value={tp.total ? Math.round((tp.known / tp.total) * 100) : 0} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
