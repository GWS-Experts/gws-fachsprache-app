"use client";

import { useTranslations } from "next-intl";
import type { Question } from "@/lib/types";

export function QuestionsEditor({ questions, onChange }: { questions: Question[]; onChange: (q: Question[]) => void }) {
  const t = useTranslations("editor");
  const update = (i: number, q: Question) => onChange(questions.map((old, idx) => (idx === i ? q : old)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= questions.length) return;
    const copy = [...questions];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    onChange(copy);
  };

  return (
    <section className="card space-y-4">
      <h2 className="font-bold text-primary">{t("questions")}</h2>
      {questions.map((q, i) => (
        <div key={i} className="space-y-3 rounded-md border border-line p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-bold text-primary">{t("questionN", { n: i + 1 })} · {q.type === "mc" ? t("typeMc") : t("typeGap")}</span>
            <div className="flex gap-1">
              <button type="button" className="btn-outline px-2 py-1" aria-label={t("up")} onClick={() => move(i, -1)}>↑</button>
              <button type="button" className="btn-outline px-2 py-1" aria-label={t("down")} onClick={() => move(i, 1)}>↓</button>
              <button type="button" className="btn-danger px-2 py-1" aria-label={t("remove")} onClick={() => onChange(questions.filter((_, idx) => idx !== i))}>✕</button>
            </div>
          </div>
          <textarea className="input min-h-11" placeholder={q.type === "gap" ? t("gapPrompt") : t("prompt")} value={q.prompt} onChange={(e) => update(i, { ...q, prompt: e.target.value })} />
          {q.type === "mc" ? (
            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <input type="radio" name={`answer-${i}`} checked={q.answer === oi} onChange={() => update(i, { ...q, answer: oi })} aria-label={t("markCorrect")} className="h-4 w-4 accent-[var(--gws-success)]" />
                  <input className="input" value={opt} placeholder={t("option", { n: oi + 1 })} onChange={(e) => update(i, { ...q, options: q.options.map((o, k) => (k === oi ? e.target.value : o)) })} />
                  <button
                    type="button"
                    className="btn-outline px-2 py-1"
                    aria-label={t("remove")}
                    disabled={q.options.length <= 2}
                    onClick={() => update(i, { ...q, options: q.options.filter((_, k) => k !== oi), answer: q.answer === oi ? 0 : q.answer > oi ? q.answer - 1 : q.answer })}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <p className="text-xs text-muted">{t("correctHint")}</p>
              {q.options.length < 8 && (
                <button type="button" className="text-sm text-primary underline" onClick={() => update(i, { ...q, options: [...q.options, ""] })}>+ {t("addOption")}</button>
              )}
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              <input className="input" placeholder={t("gapAnswer")} value={q.answer} onChange={(e) => update(i, { ...q, answer: e.target.value })} />
              <input
                className="input"
                placeholder={t("alternatives")}
                defaultValue={(q.alternatives ?? []).join(", ")}
                onBlur={(e) => update(i, { ...q, alternatives: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
              />
            </div>
          )}
          <input className="input" placeholder={t("explanation")} value={q.explanation ?? ""} onChange={(e) => update(i, { ...q, explanation: e.target.value })} />
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-outline" onClick={() => onChange([...questions, { type: "mc", prompt: "", options: ["", ""], answer: 0 }])}>+ {t("addMc")}</button>
        <button type="button" className="btn-outline" onClick={() => onChange([...questions, { type: "gap", prompt: "", answer: "" }])}>+ {t("addGap")}</button>
      </div>
    </section>
  );
}
