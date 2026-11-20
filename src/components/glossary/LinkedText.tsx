"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { markTermToLearn } from "@/app/actions/study";
import { buildMatcher, segmentText, type LinkedTerm, type TermMatcher } from "@/lib/term-matcher";
import { ARTICLE_COLORS } from "./TermCard";
import { PronounceButtons } from "./Pronounce";

type Ctx = { matcher: TermMatcher; open: (term: LinkedTerm) => void };
const GlossaryLinkContext = createContext<Ctx | null>(null);

// Stellt die Fachbegriffe einer Lektion bereit und zeigt die Erklärung an, wenn ein Begriff angeklickt wird.
export function GlossaryLinks({ terms, preview = false, children }: { terms: LinkedTerm[]; preview?: boolean; children: React.ReactNode }) {
  const matcher = useMemo(() => buildMatcher(terms), [terms]);
  const [selected, setSelected] = useState<LinkedTerm | null>(null);
  const ctx = useMemo(() => ({ matcher, open: setSelected }), [matcher]);

  return (
    <GlossaryLinkContext.Provider value={ctx}>
      {terms.length > 0 && <GlossaryHint count={terms.length} />}
      {children}
      {selected && <TermPopup key={selected.id} term={selected} preview={preview} onClose={() => setSelected(null)} />}
    </GlossaryLinkContext.Provider>
  );
}

function GlossaryHint({ count }: { count: number }) {
  const t = useTranslations("glossaryLinks");
  return (
    <p className="mb-4 text-sm text-muted">
      <span className="underline decoration-accent decoration-dotted decoration-2 underline-offset-4">{t("hintWord")}</span> {t("hint", { count })}
    </p>
  );
}

// Text mit anklickbaren Fachbegriffen. Jeder Begriff wird pro Textblock nur einmal markiert.
export function LinkedText({ text }: { text: string }) {
  const ctx = useContext(GlossaryLinkContext);
  const segments = useMemo(() => (ctx ? segmentText(text, ctx.matcher, true) : [text]), [ctx, text]);
  if (!ctx) return <>{text}</>;
  return (
    <>
      {segments.map((seg, i) =>
        typeof seg === "string" ? (
          seg
        ) : (
          <button
            key={i}
            type="button"
            onClick={() => ctx.open(seg.term)}
            className="cursor-help rounded-sm underline decoration-accent decoration-dotted decoration-2 underline-offset-4 hover:bg-accent-light hover:text-ink focus-visible:bg-accent-light"
          >
            {seg.text}
          </button>
        ),
      )}
    </>
  );
}

function TermPopup({ term, preview, onClose }: { term: LinkedTerm; preview: boolean; onClose: () => void }) {
  const t = useTranslations("glossaryLinks");
  const [saved, setSaved] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function remember() {
    setSaved("saving");
    const res = await markTermToLearn(term.id);
    setSaved(res.ok ? "saved" : "error");
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3 pb-20 sm:pb-6" role="dialog" aria-modal="false" aria-labelledby="term-popup-title">
      <div className="card mx-auto max-w-lg space-y-2 border-accent shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">{t("label")}</p>
            <h2 id="term-popup-title" className="text-xl font-bold text-primary">
              {term.article && <span className={`${ARTICLE_COLORS[term.article] ?? ""} mr-1.5`}>{term.article}</span>}
              {term.term}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-md px-2 text-xl text-muted hover:bg-primary-light" aria-label={t("close")}>
            ×
          </button>
        </div>
        <PronounceButtons term={term} withExample />
        {term.plural && <p className="text-sm text-muted">{t("plural")}: {term.plural}</p>}
        {term.explanation && <p className="text-ink">{term.explanation}</p>}
        {term.en && <p className="text-sm font-semibold text-accent">🇬🇧 {term.en}</p>}
        {term.example && <p className="text-sm italic text-muted">„{term.example}“</p>}
        {!preview && (
          <div className="pt-1">
            {saved === "saved" ? (
              <p className="text-sm font-semibold text-success">✓ {t("remembered")}</p>
            ) : (
              <button type="button" className="btn-outline px-3 py-1.5 text-sm" onClick={remember} disabled={saved === "saving"}>
                ⭐ {t("remember")}
              </button>
            )}
            {saved === "error" && <p className="mt-1 text-sm text-danger">{t("error")}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
