import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getLessons } from "@/lib/data";
import type { Module } from "@/lib/types";
import { ModuleForm } from "@/components/ModuleForm";
import { NewLessonForm } from "@/components/NewLessonForm";
import { KindBadge } from "@/components/KindBadge";
import { deleteModule } from "@/app/actions/content";
import { ConfirmButton } from "@/components/ConfirmButton";

export default async function ModuleEditPage({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await params;
  await requireStaff();
  const t = await getTranslations("content");
  const supabase = await createClient();
  const { data } = await supabase.from("modules").select("*").eq("id", moduleId).maybeSingle();
  if (!data) notFound();
  const mod = data as Module;
  const lessons = await getLessons(moduleId);

  return (
    <div className="space-y-6">
      <Link href="/admin/content" className="text-sm font-semibold text-primary hover:underline">← {t("allModules")}</Link>
      <ModuleForm module={mod} />
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-primary">{t("lessons")}</h2>
        {lessons.length === 0 && <p className="card text-sm text-muted">{t("noLessons")}</p>}
        <ol className="space-y-2">
          {lessons.map((l) => (
            <li key={l.id}>
              <Link href={`/admin/content/lesson/${l.id}`} className="card flex items-center gap-4 py-3 hover:border-primary">
                <span className="w-8 text-center text-sm font-bold text-muted">{l.sort}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{l.title_de}</p>
                  <div className="mt-1"><KindBadge kind={l.kind} /></div>
                </div>
                <span className={`badge ${l.published ? "bg-success-light text-success" : "bg-page text-muted"}`}>{l.published ? t("published") : t("draft")}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
      <NewLessonForm moduleId={moduleId} />
      <form action={deleteModule} className="text-right">
        <input type="hidden" name="id" value={mod.id} />
        <ConfirmButton message={t("confirmDeleteModule")} className="btn-danger">{t("deleteModule")}</ConfirmButton>
      </form>
    </div>
  );
}
