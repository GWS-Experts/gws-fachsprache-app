import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { requireCustomer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAttempt, getExam, getExamParts } from "@/lib/exam-data";
import { areaOf, partMinutes } from "@/lib/exam";
import { resolveAudioUrl } from "@/lib/media";
import type { Locale } from "@/lib/types";
import { ExamRunner, type RunnerPart } from "@/components/exam/ExamRunner";
import { ExamResult } from "@/components/exam/ExamResult";

export default async function AttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireCustomer();
  const t = await getTranslations("exam");
  const locale = (await getLocale()) as Locale;
  const attempt = await getAttempt(id);
  if (!attempt || attempt.user_id !== profile.id) notFound();
  const exam = await getExam(attempt.exam_id);
  if (!exam) notFound();
  const lessons = await getExamParts(exam);

  if (attempt.finished_at || attempt.current_part >= lessons.length) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href="/app/exam" className="text-sm font-semibold text-primary hover:underline">← {t("allExams")}</Link>
        <ExamResult exam={exam} attempt={attempt} parts={lessons} locale={locale} />
      </div>
    );
  }

  const supabase = await createClient();
  const current = lessons[attempt.current_part];
  const parts: RunnerPart[] = await Promise.all(
    lessons.map(async (lesson, i) => ({
      lesson,
      area: areaOf(lesson),
      minutes: partMinutes(lesson),
      maxPlays: lesson.content.max_plays ?? 2,
      // Nur für den aktuellen Teil wird die Audiodatei freigegeben.
      audioUrl: i === attempt.current_part ? await resolveAudioUrl(supabase, lesson.content.audio_path) : null,
    })),
  );
  // Restzeit wird zur Anfragezeit auf dem Server berechnet.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const remaining = Math.round((new Date(attempt.part_started_at).getTime() + partMinutes(current) * 60_000 - now) / 1000);

  return (
    <div className="mx-auto max-w-3xl">
      <ExamRunner key={attempt.current_part} attemptId={attempt.id} userId={profile.id} locale={locale} parts={parts} index={attempt.current_part} remainingSeconds={Math.max(0, remaining)} />
    </div>
  );
}
