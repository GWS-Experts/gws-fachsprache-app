import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { requireCustomer } from "@/lib/auth";
import { getLessons, getModules } from "@/lib/data";
import { getStudyOverview } from "@/lib/study-data";
import { createClient } from "@/lib/supabase/server";
import { pick, type Locale } from "@/lib/types";
import { StudyPlanForm } from "@/components/study/StudyPlanForm";
import { StudyToday } from "@/components/study/StudyToday";
import { pushConfigured, vapidPublicKey } from "@/lib/push";

export default async function StudyPlanPage() {
  const profile = await requireCustomer();
  const t = await getTranslations("plan");
  const locale = (await getLocale()) as Locale;
  const supabase = await createClient();

  const [overview, modules, lessons, doneRes, learningRes] = await Promise.all([
    getStudyOverview(profile.id),
    getModules(),
    getLessons(),
    supabase.from("progress").select("lesson_id").eq("user_id", profile.id),
    supabase.from("glossary_reviews").select("term_id", { count: "exact", head: true }).eq("user_id", profile.id).eq("known", false),
  ]);

  // Vorschlag: erste noch nicht erledigte Lektion in der Reihenfolge der Module.
  const done = new Set((doneRes.data ?? []).map((r) => r.lesson_id as string));
  const moduleOrder = new Map(modules.filter((m) => m.published).map((m, i) => [m.id, i]));
  const nextLesson = lessons
    .filter((l) => l.published && moduleOrder.has(l.module_id) && !done.has(l.id))
    .sort((a, b) => moduleOrder.get(a.module_id)! - moduleOrder.get(b.module_id)! || a.sort - b.sort)[0];
  const learningCards = learningRes.count ?? 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-primary">{t("title")}</h1>
        <p className="mt-1 text-muted">{t("intro")}</p>
      </header>

      <StudyToday overview={overview} />

      <section className="card space-y-3">
        <h2 className="font-bold text-primary">{t("suggestions")}</h2>
        <ul className="space-y-2">
          {nextLesson && (
            <li>
              <Link href={`/app/lesson/${nextLesson.id}`} className="flex items-center gap-3 rounded-md border border-line px-3 py-2.5 hover:border-primary">
                <span aria-hidden className="text-xl">📚</span>
                <span>
                  <span className="block text-xs font-semibold uppercase tracking-wide text-muted">{t("nextLesson")}</span>
                  <span className="font-semibold text-primary">{pick(nextLesson, "title", locale)}</span>
                </span>
              </Link>
            </li>
          )}
          <li>
            <Link
              href={learningCards > 0 ? "/app/glossary/train?filter=learning" : "/app/glossary/train"}
              className="flex items-center gap-3 rounded-md border border-line px-3 py-2.5 hover:border-primary"
            >
              <span aria-hidden className="text-xl">🗂️</span>
              <span>
                <span className="block text-xs font-semibold uppercase tracking-wide text-muted">{t("cards")}</span>
                <span className="font-semibold text-primary">{learningCards > 0 ? t("cardsLearning", { count: learningCards }) : t("cardsNew")}</span>
              </span>
            </Link>
          </li>
        </ul>
      </section>

      <StudyPlanForm plan={overview.plan} isNew={!overview.hasPlan} pushKey={pushConfigured() ? vapidPublicKey() : ""} />
    </div>
  );
}
