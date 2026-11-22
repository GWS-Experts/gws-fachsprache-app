"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { dismissMistake, practiceMistake, refreshMistakes } from "@/app/actions/mistakes";
import { MASTERY_STREAK } from "@/lib/mistakes";
import type { Question } from "@/lib/types";

export interface TrainerItem {
  id: string;
  question: Question;
  source: string;
  wrongCount: number;
  rightStreak: number;
}

type Checked = { correct: boolean; mastered: boolean } | null;

// Übt die gesammelten Fehler nacheinander. Jede Antwort wird sofort gespeichert.
export function MistakeTrainer({ items }: { items: TrainerItem[] }) {
  const t = useTranslations("mistakes");
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<string | number | null>(null);
  const [checked, setChecked] = useState<Checked>(null);
  const [stats, setStats] = useState({ correct: 0, mastered: 0, done: 0 });
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  const [queue, setQueue] = useState(items);

  const item = queue[index];
  const finished = !item;

  function check() {
    if (answer === null || answer === "" || !item) return;
    setFailed(false);
    startTransition(async () => {
      const res = await practiceMistake({ id: item.id, answer });
      if (!res.ok) {
        setFailed(true);
        return;
      }
      setChecked({ correct: Boolean(res.correct), mastered: Boolean(res.mastered) });
      setStats((s) => ({ correct: s.correct + (res.correct ? 1 : 0), mastered: s.mastered + (res.mastered ? 1 : 0), done: s.done + 1 }));
    });
  }

  function next() {
    setAnswer(null);
    setChecked(null);
    setIndex((i) => i + 1);
  }

  function dismiss() {
    if (!item) return;
    startTransition(async () => {
      const res = await dismissMistake(item.id);
      if (!res.ok) return setFailed(true);
      setQueue((q) => q.filter((x) => x.id !== item.id));
      setAnswer(null);
      setChecked(null);
    });
  }

  function again() {
    startTransition(async () => {
      await refreshMistakes();
      router.refresh();
    });
  }

  if (finished) {
    return (
      <div className="card space-y-4 text-center">
        <p className="text-4xl" aria-hidden>{stats.done && stats.correct === stats.done ? "🎉" : "💪"}</p>
        <p className="text-xl font-bold text-primary">{t("roundDone", { correct: stats.correct, total: stats.done })}</p>
        {stats.mastered > 0 && <p className="text-success">{t("roundMastered", { count: stats.mastered })}</p>}
        <div className="flex flex-wrap justify-center gap-3">
          <button className="btn-primary" onClick={again} disabled={pending}>{t("nextRound")}</button>
          <Link className="btn-outline" href="/app">{t("toLearn")}</Link>
        </div>
      </div>
    );
  }

  const q = item.question;
  const rightText = q.type === "mc" ? q.options[q.answer] : q.answer;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>{t("counter", { n: index + 1, total: queue.length })}</span>
        <span>{t("wrongTimes", { count: item.wrongCount })}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-primary-light">
        <div className="h-full rounded-full bg-accent" style={{ width: `${(index / queue.length) * 100}%` }} />
      </div>

      <fieldset className={`card ${checked ? (checked.correct ? "border-success" : "border-danger") : ""}`}>
        <legend className="sr-only">{t("question")}</legend>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">{item.source}</p>
        <p className="mb-3 whitespace-pre-line font-semibold">{q.prompt}</p>
        {q.type === "mc" ? (
          <div className="space-y-2">
            {q.options.map((opt, oi) => {
              const selected = answer === oi;
              const isAnswer = checked && oi === q.answer;
              return (
                <label
                  key={oi}
                  className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 text-sm ${
                    isAnswer ? "border-success bg-success-light" : selected && checked ? "border-danger bg-danger-light" : selected ? "border-primary bg-primary-light" : "border-line"
                  }`}
                >
                  <input type="radio" name="answer" className="mt-0.5 accent-[var(--gws-primary)]" checked={selected} disabled={Boolean(checked) || pending} onChange={() => setAnswer(oi)} />
                  {opt}
                </label>
              );
            })}
          </div>
        ) : (
          <input
            className="input"
            value={(answer as string) ?? ""}
            disabled={Boolean(checked) || pending}
            placeholder={t("gapPlaceholder")}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !checked && check()}
          />
        )}

        {checked && (
          <div className={`mt-3 rounded-md px-3 py-2 text-sm ${checked.correct ? "bg-success-light text-success" : "bg-danger-light text-danger"}`}>
            <p className="font-semibold">{checked.correct ? (checked.mastered ? t("mastered") : t("correctStreak", { left: MASTERY_STREAK - item.rightStreak - 1 })) : t("wrong")}</p>
            {!checked.correct && <p>{t("solution")}: {rightText}</p>}
            {q.explanation && <p className="mt-1 text-ink">{q.explanation}</p>}
          </div>
        )}
      </fieldset>

      {failed && <p className="text-sm text-danger">{t("saveError")}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {!checked ? (
          <button className="btn-primary" disabled={answer === null || answer === "" || pending} onClick={check}>{t("check")}</button>
        ) : (
          <button className="btn-accent" onClick={next}>{index + 1 < queue.length ? t("next") : t("finish")}</button>
        )}
        <button className="text-sm text-muted underline hover:text-danger" onClick={dismiss} disabled={pending}>{t("dismiss")}</button>
      </div>
    </div>
  );
}
