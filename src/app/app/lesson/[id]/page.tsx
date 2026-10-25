import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { requireCustomer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { pick, type Lesson, type Locale, type Submission } from "@/lib/types";
import { KindBadge } from "@/components/KindBadge";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";
import { SubmissionList } from "@/components/SubmissionList";

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireCustomer();
  const t = await getTranslations("lesson");
  const locale = (await getLocale()) as Locale;
  const supabase = await createClient();

  const { data } = await supabase.from("lessons").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const lesson = data as Lesson;

  const { data: siblings } = await supabase.from("lessons").select("id, sort").eq("module_id", lesson.module_id).order("sort");
  const index = (siblings ?? []).findIndex((s) => s.id === lesson.id);
  const nextId = siblings?.[index + 1]?.id ?? null;

  let audioUrl: string | null = null;
  if (lesson.content.audio_path) {
    const { data: signed } = await supabase.storage.from("fsp-media").createSignedUrl(lesson.content.audio_path, 60 * 60);
    audioUrl = signed?.signedUrl ?? null;
  }

  let submissions: Submission[] = [];
  if (lesson.kind === "writing" || lesson.kind === "speaking") {
    const { data: subs } = await supabase
      .from("submissions")
      .select("*")
      .eq("user_id", profile.id)
      .eq("lesson_id", lesson.id)
      .order("created_at", { ascending: false });
    submissions = (subs as Submission[]) ?? [];
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href={`/app/module/${lesson.module_id}`} className="text-sm font-semibold text-primary hover:underline">← {t("backToModule")}</Link>
      <header className="space-y-2">
        <KindBadge kind={lesson.kind} />
        <h1 className="text-2xl font-bold text-primary">{pick(lesson, "title", locale)}</h1>
      </header>
      <LessonPlayer lesson={lesson} locale={locale} userId={profile.id} audioUrl={audioUrl} nextHref={nextId ? `/app/lesson/${nextId}` : `/app/module/${lesson.module_id}`} />
      {submissions.length > 0 && <SubmissionList submissions={submissions} />}
      <p className="text-center text-sm">
        <Link href={`/app/messages?lesson=${lesson.id}`} className="text-primary underline">{t("askQuestion")}</Link>
      </p>
    </div>
  );
}
