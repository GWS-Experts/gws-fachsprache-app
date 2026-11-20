"use client";

import { useTranslations } from "next-intl";
import type { Question } from "@/lib/types";
import type { AnswerValue } from "@/lib/exam";

// Fragen in der Prüfung: ohne Lösungsanzeige, ausgewertet wird erst am Ende.
export function ExamQuestions({ questions, answers, onChange }: { questions: Question[]; answers: AnswerValue[]; onChange: (answers: AnswerValue[]) => void }) {
  const t = useTranslations("lesson");
  const set = (i: number, v: AnswerValue) => {
    const next = [...answers];
    while (next.length < questions.length) next.push(null);
    next[i] = v;
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {questions.map((q, i) => (
        <fieldset key={i} className="card">
          <legend className="sr-only">{t("question", { n: i + 1 })}</legend>
          <p className="mb-3 font-semibold">
            <span className="mr-2 text-primary">{i + 1}.</span>
            {q.prompt}
          </p>
          {q.type === "mc" ? (
            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                const selected = answers[i] === oi;
                return (
                  <label key={oi} className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 text-sm ${selected ? "border-primary bg-primary-light" : "border-line"}`}>
                    <input type="radio" name={`q${i}`} className="mt-0.5 accent-[var(--gws-primary)]" checked={selected} onChange={() => set(i, oi)} />
                    {opt}
                  </label>
                );
              })}
            </div>
          ) : (
            <input className="input" value={(answers[i] as string) ?? ""} placeholder={t("gapPlaceholder")} onChange={(e) => set(i, e.target.value)} />
          )}
        </fieldset>
      ))}
    </div>
  );
}
