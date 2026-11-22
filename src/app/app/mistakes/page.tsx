import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { requireCustomer } from "@/lib/auth";
import { getMistakeOverview, nextSession } from "@/lib/mistakes-data";
import { getGlossaryReviews } from "@/lib/glossary";
import type { Locale } from "@/lib/types";
import { MistakeTrainer, type TrainerItem } from "@/components/mistakes/MistakeTrainer";

export default async function MistakesPage() {
  const profile = await requireCustomer();
  const t = await getTranslations("mistakes");
  const locale = (await getLocale()) as Locale;
  const [overview, reviews] = await Promise.all([getMistakeOverview(profile.id, { sync: true }), getGlossaryReviews(profile.id)]);
  const learningTerms = reviews.filter((r) => !r.known).length;

  const bySource = { lesson: 0, exam: 0, writing: 0 };
  for (const m of overview.open) bySource[m.source]++;

  const items: TrainerItem[] = nextSession(overview.open).map((m) => {
    const title = m.lesson_id ? overview.lessonTitles[m.lesson_id]?.[locale] : undefined;
    return {
      id: m.id,
      question: m.question,
      source: title ? t(`source.${m.source}`, { title }) : t(`sourceShort.${m.source}`),
      wrongCount: m.wrong_count,
      rightStreak: m.right_streak,
    };
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-primary">{t("title")}</h1>
        <p className="mt-1 text-muted">{t("intro")}</p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-accent tabular-nums">{overview.open.length}</p>
          <p className="text-xs text-muted">{t("statOpen")}</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-success tabular-nums">{overview.masteredCount}</p>
          <p className="text-xs text-muted">{t("statMastered")}</p>
        </div>
        <div className="card col-span-2 text-sm">
          <p className="mb-1 font-semibold text-primary">{t("statWhere")}</p>
          <ul className="space-y-0.5 text-muted">
            <li>{t("fromLessons", { count: bySource.lesson })}</li>
            <li>{t("fromExams", { count: bySource.exam })}</li>
            <li>{t("fromWriting", { count: bySource.writing })}</li>
          </ul>
        </div>
      </section>

      {!overview.available ? (
        <p className="card text-muted">{t("notReady")}</p>
      ) : items.length > 0 ? (
        <MistakeTrainer key={nextSession(overview.open).map((m) => `${m.id}:${m.last_practiced_at ?? ""}`).join()} items={items} />
      ) : (
        <div className="card space-y-2 text-center">
          <p className="text-4xl" aria-hidden>{overview.masteredCount ? "🏅" : "🌱"}</p>
          <p className="font-semibold text-primary">{overview.masteredCount ? t("allMastered") : t("emptyTitle")}</p>
          <p className="text-sm text-muted">{t("emptyText")}</p>
          <Link href="/app" className="btn-primary inline-block">{t("toLearn")}</Link>
        </div>
      )}

      {learningTerms > 0 && (
        <Link href="/app/glossary/train?filter=learning" className="card flex items-center justify-between gap-3 transition hover:border-primary">
          <span>
            <span className="block font-semibold text-primary">📖 {t("termsTitle", { count: learningTerms })}</span>
            <span className="block text-sm text-muted">{t("termsText")}</span>
          </span>
          <span className="text-primary" aria-hidden>→</span>
        </Link>
      )}
    </div>
  );
}
