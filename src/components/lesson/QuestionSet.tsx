"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Question } from "@/lib/types";

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ").replace(/[.!?,;:]$/, "");
}

export function isCorrect(q: Question, answer: string | number | undefined) {
  if (answer === undefined || answer === "") return false;
  if (q.type === "mc") return answer === q.answer;
  const given = normalize(String(answer));
  return [q.answer, ...(q.alternatives ?? [])].some((a) => normalize(a) === given);
}

export function QuestionSet({ questions, onComplete }: { questions: Question[]; onComplete: (score: number, max: number) => void }) {
  const t = useTranslations("lesson");
  const [answers, setAnswers] = useState<Record<number, string | number>>({});
  const [checked, setChecked] = useState(false);

  if (questions.length === 0) return null;
  const allAnswered = questions.every((_, i) => answers[i] !== undefined && answers[i] !== "");
  const score = questions.filter((q, i) => isCorrect(q, answers[i])).length;

  return (
    <div className="space-y-5">
      {questions.map((q, i) => {
        const correct = checked && isCorrect(q, answers[i]);
        const wrong = checked && !correct;
        return (
          <fieldset key={i} className={`card ${correct ? "border-success" : wrong ? "border-danger" : ""}`}>
            <legend className="sr-only">{t("question", { n: i + 1 })}</legend>
            <p className="mb-3 font-semibold">
              <span className="mr-2 text-primary">{i + 1}.</span>
              {q.prompt}
            </p>
            {q.type === "mc" ? (
              <div className="space-y-2">
                {q.options.map((opt, oi) => {
                  const selected = answers[i] === oi;
                  const isAnswer = checked && oi === q.answer;
                  return (
                    <label
                      key={oi}
                      className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 text-sm ${
                        isAnswer ? "border-success bg-success-light" : selected && checked ? "border-danger bg-danger-light" : selected ? "border-primary bg-primary-light" : "border-line"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q${i}`}
                        className="mt-0.5 accent-[var(--gws-primary)]"
                        checked={selected}
                        disabled={checked}
                        onChange={() => setAnswers({ ...answers, [i]: oi })}
                      />
                      {opt}
                    </label>
                  );
                })}
              </div>
            ) : (
              <input
                className="input"
                value={(answers[i] as string) ?? ""}
                disabled={checked}
                placeholder={t("gapPlaceholder")}
                onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
              />
            )}
            {checked && (
              <div className={`mt-3 rounded-md px-3 py-2 text-sm ${correct ? "bg-success-light text-success" : "bg-danger-light text-danger"}`}>
                <p className="font-semibold">{correct ? t("correct") : t("wrong")}</p>
                {!correct && q.type === "gap" && <p>{t("solution")}: {q.answer}</p>}
                {q.explanation && <p className="mt-1 text-ink">{q.explanation}</p>}
              </div>
            )}
          </fieldset>
        );
      })}
      {!checked ? (
        <button className="btn-primary w-full sm:w-auto" disabled={!allAnswered} onClick={() => setChecked(true)}>
          {t("check")}
        </button>
      ) : (
        <button className="btn-accent w-full sm:w-auto" onClick={() => onComplete(score, questions.length)}>
          {t("finish")}
        </button>
      )}
    </div>
  );
}
