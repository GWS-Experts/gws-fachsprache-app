"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { saveProgress } from "@/app/actions/learning";
import type { Lesson, Locale } from "@/lib/types";
import { QuestionSet } from "./QuestionSet";
import { Vocabulary } from "./Vocabulary";
import { Listening } from "./Listening";
import { Dialogue } from "./Dialogue";
import { Writing } from "./Writing";
import { Speaking } from "./Speaking";

type Result = { score: number; max: number } | null;

export function LessonPlayer({ lesson, locale, userId, audioUrl, nextHref, preview = false }: { lesson: Lesson; locale: Locale; userId: string; audioUrl: string | null; nextHref: string; preview?: boolean }) {
  const t = useTranslations("lesson");
  const router = useRouter();
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [result, setResult] = useState<Result>(null);
  const [submitted, setSubmitted] = useState(false);
  const [round, setRound] = useState(0);
  const c = lesson.content;
  const intro = locale === "en" ? c.intro_en || c.intro_de : c.intro_de;
  const task = locale === "en" ? c.task_en || c.task_de : c.task_de;

  async function complete(score: number, max: number) {
    setResult({ score, max });
    if (preview) return;
    await saveProgress({ lessonId: lesson.id, score, maxScore: max, durationSeconds: Math.round((Date.now() - startedAt) / 1000) });
    router.refresh();
  }

  function restart() {
    setResult(null);
    setSubmitted(false);
    setStartedAt(Date.now());
    setRound((r) => r + 1);
  }

  if (result || submitted) {
    const pct = result && result.max ? Math.round((result.score / result.max) * 100) : null;
    return (
      <div className="card space-y-4 text-center">
        <p className="text-4xl" aria-hidden>{pct === null ? "📨" : pct >= 70 ? "🎉" : "💪"}</p>
        {pct !== null ? (
          <>
            <p className="text-xl font-bold text-primary">{t("result", { score: result!.score, max: result!.max })}</p>
            <p className="text-muted">{pct >= 70 ? t("resultGood") : t("resultPractice")}</p>
          </>
        ) : (
          <p className="text-lg font-semibold text-primary">{t("submittedInfo")}</p>
        )}
        <div className="flex flex-wrap justify-center gap-3">
          <button className="btn-outline" onClick={restart}>{t("again")}</button>
          <Link className="btn-primary" href={nextHref}>{t("next")}</Link>
        </div>
      </div>
    );
  }

  const questions = c.questions ?? [];

  return (
    <div key={round} className="space-y-5">
      {intro && <p className="rounded-md border-l-4 border-accent bg-accent-light px-4 py-3 text-sm">{intro}</p>}
      {task && (
        <div className="card">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">{t("task")}</p>
          <p className="whitespace-pre-line">{task}</p>
          {c.hints && c.hints.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
              {c.hints.map((h, i) => <li key={i}>{h}</li>)}
            </ul>
          )}
        </div>
      )}

      {lesson.kind === "reading" && (
        <>
          <article className="card whitespace-pre-line leading-relaxed">{c.text}</article>
          <QuestionSet questions={questions} onComplete={complete} />
        </>
      )}
      {lesson.kind === "listening" && <Listening transcript={c.transcript ?? ""} audioUrl={audioUrl} questions={questions} onComplete={complete} />}
      {lesson.kind === "vocabulary" && <Vocabulary items={c.items ?? []} onComplete={complete} />}
      {lesson.kind === "quiz" && <QuestionSet questions={questions} onComplete={complete} />}
      {lesson.kind === "dialogue" && (
        <>
          <Dialogue lines={c.lines ?? []} />
          {questions.length > 0 ? <QuestionSet questions={questions} onComplete={complete} /> : (
            <button className="btn-primary" onClick={() => complete(0, 0)}>{t("finish")}</button>
          )}
        </>
      )}
      {lesson.kind === "writing" && (
        <>
          {c.text && <article className="card whitespace-pre-line text-sm leading-relaxed">{c.text}</article>}
          <Writing preview={preview} lessonId={lesson.id} minWords={c.min_words ?? 80} startedAt={startedAt} onDone={() => { setSubmitted(true); router.refresh(); }} />
        </>
      )}
      {lesson.kind === "speaking" && (
        <>
          {c.text && <article className="card whitespace-pre-line text-sm leading-relaxed">{c.text}</article>}
          <Speaking preview={preview} lessonId={lesson.id} userId={userId} maxSeconds={c.max_seconds ?? 120} startedAt={startedAt} onDone={() => { setSubmitted(true); router.refresh(); }} />
        </>
      )}
    </div>
  );
}
