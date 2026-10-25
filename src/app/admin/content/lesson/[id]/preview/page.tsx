import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { pick, type Lesson, type Locale } from "@/lib/types";
import { KindBadge } from "@/components/KindBadge";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";

export default async function LessonPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await requireStaff();
  const t = await getTranslations("editor");
  const locale = (await getLocale()) as Locale;
  const supabase = await createClient();
  const { data } = await supabase.from("lessons").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const lesson = data as Lesson;

  let audioUrl: string | null = null;
  if (lesson.content.audio_path) {
    const { data: signed } = await supabase.storage.from("fsp-media").createSignedUrl(lesson.content.audio_path, 3600);
    audioUrl = signed?.signedUrl ?? null;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href={`/admin/content/lesson/${lesson.id}`} className="text-sm font-semibold text-primary hover:underline">← {t("backToEditor")}</Link>
      <p className="rounded-md bg-accent-light px-4 py-2 text-sm text-accent">{t("previewNote")}</p>
      <header className="space-y-2">
        <KindBadge kind={lesson.kind} />
        <h1 className="text-2xl font-bold text-primary">{pick(lesson, "title", locale)}</h1>
      </header>
      <LessonPlayer lesson={lesson} locale={locale} userId={staff.id} audioUrl={audioUrl} nextHref={`/admin/content/lesson/${lesson.id}`} preview />
    </div>
  );
}
