import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getLessons, getModules } from "@/lib/data";
import { PRACTICE_KINDS, formatClock, isManual, summarize, type Bucket, type Exam, type ExamArea, type ExamAttempt } from "@/lib/exam";
import { isCorrect } from "@/lib/questions";
import { pick, type Lesson, type Locale, type Submission } from "@/lib/types";
import { ExamReviewForm } from "./ExamReviewForm";
import { getCurrentProfile } from "@/lib/auth";

function Meter({ value, pass }: { value: number | null; pass: number }) {
  const v = value ?? 0;
  return (
    <div className="relative h-3 overflow-hidden rounded-full bg-primary-light">
      <div className={`h-full rounded-full ${v >= pass ? "bg-success" : "bg-accent"}`} style={{ width: `${Math.min(100, v)}%` }} />
      <div className="absolute top-0 h-full w-0.5 bg-ink/40" style={{ left: `${pass}%` }} aria-hidden />
    </div>
  );
}

// Auswertung einer Probeprüfung – für Kunden und (mit Bewertungsformular) für GWS.
export async function ExamResult({ exam, attempt, parts, locale, staff = false }: { exam: Exam; attempt: ExamAttempt; parts: Lesson[]; locale: Locale; staff?: boolean }) {
  const t = await getTranslations("exam");
  const supabase = await createClient();
  const summary = summarize(attempt, parts, exam.pass_percent);
  const pass = exam.pass_percent;

  const submissionIds = Object.values(attempt.answers ?? {}).map((a) => a.submission_id).filter((x): x is string => Boolean(x));
  const { data: subs } = submissionIds.length ? await supabase.from("submissions").select("*").in("id", submissionIds) : { data: [] };
  const submissionById = new Map(((subs ?? []) as Submission[]).map((s) => [s.id, s]));
  const recordingUrls = new Map<string, string>();
  await Promise.all(
    [...submissionById.values()].filter((s) => s.audio_path).map(async (s) => {
      const { data } = await supabase.storage.from("fsp-recordings").createSignedUrl(s.audio_path!, 60 * 60);
      if (data?.signedUrl) recordingUrls.set(s.id, data.signedUrl);
    }),
  );

  // Übungsvorschläge für Bereiche unter der Bestehensgrenze (nur reguläre, veröffentlichte Module).
  let suggestions: { area: ExamArea; lessons: Lesson[] }[] = [];
  if (!staff) {
    const weak = summary.areas.filter((a) => !a.pending && (a.percent ?? 0) < pass);
    if (weak.length) {
      const [modules, lessons] = await Promise.all([getModules(), getLessons()]);
      const regular = new Set(modules.filter((m) => m.published && m.id !== exam.module_id).map((m) => m.id));
      suggestions = weak.map((a) => ({
        area: a.area,
        lessons: lessons.filter((l) => regular.has(l.module_id) && l.published && PRACTICE_KINDS[a.area].includes(l.kind)).slice(0, 4),
      }));
    }
  }

  // Falsch beantwortete Fragen landen im Fehlertrainer.
  const wrongAnswers = summary.parts.reduce((n, p) => n + (isManual(p.lesson) || p.score === null ? 0 : p.max - p.score), 0);
  const viewer = !staff && summary.passed ? await getCurrentProfile() : null;
  const hasName = staff || Boolean(viewer && `${viewer.first_name}${viewer.last_name}`.trim());

  const fmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "de-DE", { dateStyle: "long", timeStyle: "short" });
  const status = summary.passed === null ? "pending" : summary.passed ? "passed" : "failed";
  const statusStyle = { pending: "bg-accent-light text-accent", passed: "bg-success-light text-success", failed: "bg-danger-light text-danger" }[status];

  const bucketRow = (label: string, b: Bucket) =>
    b.max > 0 && (
      <div className="space-y-1">
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="font-semibold">{label}</span>
          <span className="tabular-nums">
            {b.score} / {b.max} · <strong>{b.percent ?? 0} %</strong>
            {b.pending && <span className="ml-2 badge bg-accent-light text-accent">{t("statusPending")}</span>}
          </span>
        </div>
        <Meter value={b.percent} pass={pass} />
      </div>
    );

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm text-muted">{fmt.format(new Date(attempt.started_at))}</p>
        <h1 className="text-2xl font-bold text-primary">{t("resultTitle", { title: pick(exam, "title", locale) })}</h1>
      </header>

      <section className="card space-y-4 text-center">
        <p className="text-5xl font-bold text-primary tabular-nums">{summary.total.percent ?? 0} %</p>
        <p className="text-sm text-muted">{t("totalPoints", { score: summary.total.score, max: summary.total.max })}</p>
        <p><span className={`badge px-3 py-1 text-sm ${statusStyle}`}>{t(({ pending: "statusPending", passed: "statusPassed", failed: "statusFailed" } as const)[status])}</span></p>
        <p className="text-sm">{t(`verdict.${status}`, { percent: pass })}</p>
        <p className="text-xs text-muted">{t("timeUsed", { time: formatClock(summary.seconds) })}</p>
      </section>

      <section className="card space-y-4">
        <h2 className="font-bold text-primary">{t("byPart")}</h2>
        {bucketRow(t("written"), summary.written)}
        {bucketRow(t("oral"), summary.oral)}
        <hr className="border-line" />
        {summary.areas.map((a) => <div key={a.area}>{bucketRow(t(`areas.${a.area}`), a)}</div>)}
        <p className="text-xs text-muted">{t("passLine", { percent: pass })}</p>
      </section>

      {summary.passed && (
        <section className="card space-y-3 border-success text-center">
          <p className="text-4xl" aria-hidden>🎓</p>
          <h2 className="font-bold text-primary">{t("certificateTitle")}</h2>
          <p className="text-sm">{t("certificateText")}</p>
          {hasName ? (
            <a href={`/api/certificate/${attempt.id}`} target="_blank" rel="noopener" className="btn-primary inline-block">{t("certificateDownload")}</a>
          ) : (
            <p className="text-sm">
              {t("certificateNeedsName")}{" "}
              <Link href="/app/profile" className="font-semibold text-primary underline">{t("certificateToProfile")}</Link>
            </p>
          )}
          <p className="text-xs text-muted">{t("certificateNote")}</p>
        </section>
      )}

      {!staff && wrongAnswers > 0 && (
        <Link href="/app/mistakes" className="card flex items-center justify-between gap-3 transition hover:border-primary">
          <span>
            <span className="block font-semibold text-primary">🎯 {t("mistakesTitle", { count: wrongAnswers })}</span>
            <span className="block text-sm text-muted">{t("mistakesText")}</span>
          </span>
          <span className="text-primary" aria-hidden>→</span>
        </Link>
      )}

      {attempt.staff_comment && (
        <section className="card border-accent">
          <h2 className="mb-1 font-bold text-primary">{t("staffComment")}</h2>
          <p className="whitespace-pre-line text-sm">{attempt.staff_comment}</p>
        </section>
      )}

      {suggestions.length > 0 && (
        <section className="card space-y-3">
          <h2 className="font-bold text-primary">{t("practiceTitle")}</h2>
          {suggestions.map((s) => (
            <div key={s.area}>
              <p className="text-sm font-semibold">{t(`areas.${s.area}`)}</p>
              {s.lessons.length ? (
                <ul className="mt-1 flex flex-wrap gap-2">
                  {s.lessons.map((l) => (
                    <li key={l.id}><Link href={`/app/lesson/${l.id}`} className="badge bg-primary-light text-primary hover:underline">{pick(l, "title", locale)}</Link></li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">{t("practiceNone")}</p>
              )}
            </div>
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-primary">{t("details")}</h2>
        {summary.parts.map((p, i) => {
          const sub = p.answer?.submission_id ? submissionById.get(p.answer.submission_id) : undefined;
          const qs = p.lesson.content.questions ?? [];
          const given = p.answer?.answers ?? [];
          return (
            <details key={p.lesson.id} className="card" open={staff && isManual(p.lesson)}>
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">
                  <span className="mr-2 text-muted">{i + 1}.</span>
                  {pick(p.lesson, "title", locale)}
                </span>
                <span className="text-sm tabular-nums">
                  {p.score === null ? <span className="badge bg-accent-light text-accent">{t("statusPending")}</span> : `${p.score} / ${p.max}`}
                  <span className="ml-3 text-muted">⏱ {formatClock(p.seconds)} / {formatClock(p.limitSeconds)}</span>
                  {p.timedOut && <span className="ml-2 badge bg-danger-light text-danger">{t("timedOut")}</span>}
                </span>
              </summary>
              <div className="mt-4 space-y-3 text-sm">
                {!isManual(p.lesson) &&
                  qs.map((q, qi) => {
                    const a = given[qi];
                    const yours = a === null || a === undefined || a === "" ? "—" : q.type === "mc" ? q.options[Number(a)] ?? "—" : String(a);
                    const right = q.type === "mc" ? q.options[q.answer] : q.answer;
                    const ok = isCorrect(q, a ?? undefined);
                    return (
                      <div key={qi} className={`rounded-md border p-3 ${ok ? "border-success" : "border-danger"}`}>
                        <p className="font-semibold">{ok ? "✓" : "✗"} {qi + 1}. {q.prompt}</p>
                        <p className="mt-1">{t("yourAnswer")}: <span className={ok ? "text-success" : "text-danger"}>{yours}</span></p>
                        {!ok && <p className="text-success">{t("correctAnswer")}: {right}</p>}
                        {q.explanation && <p className="mt-1 text-muted">{q.explanation}</p>}
                      </div>
                    );
                  })}
                {p.lesson.kind === "writing" && (
                  <>
                    {p.answer?.text ? <p className="whitespace-pre-line rounded-md bg-primary-light p-3">{p.answer.text}</p> : <p className="text-muted">{t("nothingSubmitted")}</p>}
                  </>
                )}
                {p.lesson.kind === "speaking" && (
                  <>{sub && recordingUrls.get(sub.id) ? <audio controls src={recordingUrls.get(sub.id)} className="w-full" /> : <p className="text-muted">{t("nothingSubmitted")}</p>}</>
                )}
                {sub?.feedback && (
                  <div className="rounded-md border-l-4 border-success bg-success-light p-3">
                    <p className="font-semibold text-success">{t("feedback")}</p>
                    <p className="whitespace-pre-line">{sub.feedback}</p>
                  </div>
                )}
              </div>
            </details>
          );
        })}
      </section>

      {staff && (
        <ExamReviewForm
          attemptId={attempt.id}
          comment={attempt.staff_comment ?? ""}
          parts={summary.parts.filter((p) => isManual(p.lesson)).map((p) => ({
            id: p.lesson.id,
            title: p.lesson.title_de,
            max: p.max,
            points: attempt.staff_points?.[p.lesson.id] ?? null,
            submitted: Boolean(p.answer?.submission_id),
          }))}
        />
      )}
    </div>
  );
}
