import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { requireCustomer } from "@/lib/auth";
import { getLessons } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { pick, type Locale, type Module, type Progress } from "@/lib/types";
import { KindBadge } from "@/components/KindBadge";

export default async function ModulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireCustomer();
  const t = await getTranslations("learn");
  const locale = (await getLocale()) as Locale;
  const supabase = await createClient();

  const { data: mod } = await supabase.from("modules").select("*").eq("id", id).maybeSingle();
  if (!mod) notFound();
  const lessons = await getLessons(id);
  const { data: progress } = await supabase
    .from("progress")
    .select("lesson_id, score, max_score")
    .eq("user_id", profile.id)
    .in("lesson_id", lessons.map((l) => l.id));

  const best = new Map<string, Pick<Progress, "score" | "max_score">>();
  for (const p of (progress ?? []) as Progress[]) {
    const prev = best.get(p.lesson_id);
    if (!prev || (p.max_score && p.score / p.max_score > prev.score / Math.max(prev.max_score, 1))) best.set(p.lesson_id, p);
  }

  return (
    <div className="space-y-6">
      <Link href="/app" className="text-sm font-semibold text-primary hover:underline">← {t("allModules")}</Link>
      <header>
        <h1 className="text-2xl font-bold text-primary">{pick(mod as Module, "title", locale)}</h1>
        <p className="mt-1 text-muted">{pick(mod as Module, "description", locale)}</p>
      </header>
      <ol className="space-y-3">
        {lessons.map((lesson, i) => {
          const result = best.get(lesson.id);
          return (
            <li key={lesson.id}>
              <Link href={`/app/lesson/${lesson.id}`} className="card flex items-center gap-4 py-4 transition hover:border-primary">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${result ? "bg-success text-white" : "bg-primary-light text-primary"}`}>
                  {result ? "✓" : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{pick(lesson, "title", locale)}</p>
                  <div className="mt-1"><KindBadge kind={lesson.kind} /></div>
                </div>
                {result && result.max_score > 0 && (
                  <span className="text-sm font-semibold text-success">{Math.round((result.score / result.max_score) * 100)}%</span>
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
