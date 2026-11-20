"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { endExamEarly, finishPart } from "@/app/actions/exam";
import { createClient } from "@/lib/supabase/client";
import { formatClock, type AnswerValue, type ExamArea } from "@/lib/exam";
import type { Lesson, Locale } from "@/lib/types";
import { ExamQuestions } from "./ExamQuestions";
import { ExamAudio } from "./ExamAudio";
import { ExamRecorder, type RecorderHandle } from "./ExamRecorder";

export interface RunnerPart {
  lesson: Lesson;
  area: ExamArea;
  minutes: number;
  maxPlays: number;
  audioUrl: string | null;
}

// Führt durch einen Prüfungsteil mit Countdown. Die Zeit läuft auf dem Server weiter,
// auch wenn die Seite geschlossen wird; ist sie abgelaufen, wird der Teil automatisch abgegeben.
export function ExamRunner({
  attemptId,
  userId,
  locale,
  parts,
  index,
  remainingSeconds,
}: {
  attemptId: string;
  userId: string;
  locale: Locale;
  parts: RunnerPart[];
  index: number;
  remainingSeconds: number;
}) {
  const t = useTranslations("exam");
  const router = useRouter();
  const part = parts[index];
  const lesson = part.lesson;
  const c = lesson.content;
  const [deadline] = useState(() => Date.now() + remainingSeconds * 1000);
  const [left, setLeft] = useState(remainingSeconds);
  const [answers, setAnswers] = useState<AnswerValue[]>([]);
  const [text, setText] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const recorder = useRef<RecorderHandle | null>(null);
  const done = useRef(false);

  const intro = locale === "en" ? c.intro_en || c.intro_de : c.intro_de;
  const task = locale === "en" ? c.task_en || c.task_de : c.task_de;
  const questions = c.questions ?? [];
  const open = questions.filter((_, i) => answers[i] === undefined || answers[i] === null || answers[i] === "").length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  const submit = useCallback(
    async (timedOut: boolean) => {
      if (done.current) return;
      done.current = true;
      setSending(true);
      setError(false);
      let audioPath: string | undefined;
      if (lesson.kind === "speaking") {
        const blob = await recorder.current?.finish();
        if (blob && blob.size > 0) {
          const ext = blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm";
          const path = `${userId}/${lesson.id}/${Date.now()}.${ext}`;
          const { error: upError } = await createClient().storage.from("fsp-recordings").upload(path, blob, { contentType: blob.type.split(";")[0] });
          if (!upError) audioPath = path;
        }
      }
      const res = await finishPart({ attemptId, partIndex: index, answers, text, audioPath, timedOut }).catch(() => ({ ok: false }));
      if (!res.ok) {
        done.current = false;
        setSending(false);
        setError(true);
        return;
      }
      window.scrollTo({ top: 0 });
      router.refresh();
    },
    [answers, attemptId, index, lesson.id, lesson.kind, router, text, userId],
  );

  // Countdown; bei 0 wird automatisch abgegeben.
  const submitRef = useRef(submit);
  useEffect(() => {
    submitRef.current = submit;
  }, [submit]);
  useEffect(() => {
    const tick = () => {
      const s = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setLeft(s);
      if (s <= 0) void submitRef.current(true);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  // Warnung beim Verlassen der Seite während der Prüfung.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (!done.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const urgent = left <= 60;
  const isLast = index === parts.length - 1;

  return (
    <div className="space-y-5">
      <div className="sticky top-0 z-20 -mx-4 border-b border-line bg-surface/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-lg sm:border">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">
              {t("partOf", { n: index + 1, total: parts.length })} · {t(`areas.${part.area}`)}
            </p>
            <p className="truncate font-bold text-primary">{lesson.title_de}</p>
          </div>
          <div className={`rounded-md px-3 py-1.5 text-center font-mono text-xl font-bold tabular-nums ${urgent ? "animate-pulse bg-danger-light text-danger" : "bg-primary-light text-primary"}`} role="timer" aria-live={urgent ? "polite" : "off"}>
            ⏱ {formatClock(left)}
          </div>
        </div>
        <ol className="mt-2 flex gap-1" aria-hidden>
          {parts.map((p, i) => (
            <li key={p.lesson.id} className={`h-1.5 flex-1 rounded-full ${i < index ? "bg-success" : i === index ? "bg-accent" : "bg-primary-light"}`} />
          ))}
        </ol>
      </div>

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

      {(lesson.kind === "reading" || lesson.kind === "quiz" || lesson.kind === "writing" || lesson.kind === "speaking") && c.text && (
        <article className="card whitespace-pre-line leading-relaxed">{c.text}</article>
      )}

      {(lesson.kind === "listening" || lesson.kind === "dialogue") && (
        <ExamAudio
          audioUrl={part.audioUrl}
          script={lesson.kind === "dialogue" ? (c.lines ?? []).map((l) => `${l.speaker}: ${l.text}`).join("\n") : c.transcript ?? ""}
          maxPlays={part.maxPlays}
        />
      )}

      {questions.length > 0 && lesson.kind !== "writing" && lesson.kind !== "speaking" && (
        <ExamQuestions questions={questions} answers={answers} onChange={setAnswers} />
      )}

      {lesson.kind === "writing" && (
        <div className="card space-y-2">
          <label className="label" htmlFor="exam-writing">{t("yourText")}</label>
          <textarea id="exam-writing" className="input min-h-72" value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
          <p className={`text-sm ${words >= (c.min_words ?? 0) ? "text-success" : "text-muted"}`}>{t("words", { count: words, min: c.min_words ?? 0 })}</p>
        </div>
      )}

      {lesson.kind === "speaking" && <ExamRecorder ref={recorder} maxSeconds={c.max_seconds ?? 180} />}

      <div className="card space-y-3">
        {!confirming ? (
          <button className="btn-primary w-full sm:w-auto" onClick={() => setConfirming(true)} disabled={sending}>
            {isLast ? t("finishExam") : t("finishPart")}
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-semibold">
              {isLast ? t("confirmFinishExam") : t("confirmFinishPart")}
              {open > 0 && <span className="ml-1 text-danger">{t("openQuestions", { count: open })}</span>}
            </p>
            <div className="flex flex-wrap gap-3">
              <button className="btn-accent" onClick={() => submit(false)} disabled={sending}>{sending ? t("sending") : t("yesContinue")}</button>
              <button className="btn-outline" onClick={() => setConfirming(false)} disabled={sending}>{t("back")}</button>
            </div>
          </div>
        )}
        {sending && <p className="text-sm text-muted">{t("sending")}</p>}
        {error && (
          <p className="text-sm text-danger">
            {t("sendError")}{" "}
            <button className="underline" onClick={() => submit(left <= 0)}>{t("retry")}</button>
          </p>
        )}
      </div>

      <div className="text-center text-sm">
        {!confirmEnd ? (
          <button className="text-muted underline" onClick={() => setConfirmEnd(true)}>{t("endEarly")}</button>
        ) : (
          <form
            action={endExamEarly}
            onSubmit={() => {
              done.current = true;
            }}
            className="inline-flex flex-wrap items-center justify-center gap-3"
          >
            <input type="hidden" name="attempt_id" value={attemptId} />
            <span>{t("confirmEndEarly")}</span>
            <button className="btn-danger">{t("endEarlyYes")}</button>
            <button type="button" className="btn-outline" onClick={() => setConfirmEnd(false)}>{t("back")}</button>
          </form>
        )}
      </div>
    </div>
  );
}
