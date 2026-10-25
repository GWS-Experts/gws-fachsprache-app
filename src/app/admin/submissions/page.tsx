import { getTranslations } from "next-intl/server";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getLessons } from "@/lib/data";
import type { Profile, Submission } from "@/lib/types";
import { FeedbackList } from "@/components/FeedbackList";

export default async function SubmissionsPage({ searchParams }: { searchParams: Promise<{ all?: string }> }) {
  await requireStaff();
  const t = await getTranslations("feedback");
  const { all } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("submissions").select("*").order("created_at", { ascending: false }).limit(100);
  if (!all) query = query.is("feedback", null);
  const [{ data: subs }, { data: profiles }, lessons] = await Promise.all([query, supabase.from("profiles").select("id, first_name, last_name, email"), getLessons()]);

  const names = new Map(((profiles ?? []) as Profile[]).map((p) => [p.id, `${p.first_name} ${p.last_name}`.trim() || p.email]));
  const lessonById = new Map(lessons.map((l) => [l.id, l]));
  const rows = ((subs ?? []) as Submission[]).map((s) => ({ ...s, lesson: lessonById.get(s.lesson_id), customerName: names.get(s.user_id) }));

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("intro")}</p>
        </div>
        <a href={all ? "/admin/submissions" : "/admin/submissions?all=1"} className="btn-outline">{all ? t("showPending") : t("showAll")}</a>
      </header>
      <FeedbackList submissions={rows} />
    </div>
  );
}
