import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Lesson } from "@/lib/types";
import { KindBadge } from "@/components/KindBadge";
import { LessonEditor } from "@/components/editor/LessonEditor";
import { ConfirmButton } from "@/components/ConfirmButton";
import { deleteLesson } from "@/app/actions/content";

export default async function LessonEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireStaff();
  const t = await getTranslations("editor");
  const supabase = await createClient();
  const { data } = await supabase.from("lessons").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const lesson = data as Lesson;

  return (
    <div className="space-y-6">
      <Link href={`/admin/content/${lesson.module_id}`} className="text-sm font-semibold text-primary hover:underline">← {t("backToModule")}</Link>
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-primary">{lesson.title_de}</h1>
        <KindBadge kind={lesson.kind} />
      </header>
      <LessonEditor lesson={lesson} />
      <form action={deleteLesson} className="text-right">
        <input type="hidden" name="id" value={lesson.id} />
        <ConfirmButton message={t("confirmDelete")} className="btn-danger">{t("delete")}</ConfirmButton>
      </form>
    </div>
  );
}
