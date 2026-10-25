import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { requireCustomer } from "@/lib/auth";
import { getLearningStats } from "@/lib/data";
import { pick, type Locale } from "@/lib/types";
import { ProgressBar } from "@/components/ProgressBar";

export default async function LearnPage() {
  const profile = await requireCustomer();
  const t = await getTranslations("learn");
  const locale = (await getLocale()) as Locale;
  const stats = await getLearningStats(profile.id);

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-gradient-to-br from-primary to-accent p-6 text-white">
        <p className="text-sm opacity-80">{t("hello", { name: profile.first_name || profile.email })}</p>
        <h1 className="mt-1 text-2xl font-bold">{t("title")}</h1>
        <p className="mt-2 max-w-2xl text-sm opacity-90">{t("intro")}</p>
        <div className="mt-4 max-w-md rounded-md bg-white/10 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide opacity-80">{t("overall")}</p>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-lime" style={{ width: `${stats.percent}%` }} />
          </div>
          <p className="mt-2 text-sm">{t("lessonsDone", { done: stats.doneLessons, total: stats.totalLessons })}</p>
        </div>
      </section>

      {stats.modules.length === 0 ? (
        <p className="card text-muted">{t("empty")}</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.modules.map(({ module, total, done, percent }) => (
            <li key={module.id}>
              <Link href={`/app/module/${module.id}`} className="card flex h-full flex-col transition hover:border-primary hover:shadow-md">
                <h2 className="text-lg font-bold text-primary">{pick(module, "title", locale)}</h2>
                <p className="mt-1 flex-1 text-sm text-muted">{pick(module, "description", locale)}</p>
                <p className="mt-4 text-xs font-semibold text-muted">{t("lessonsDone", { done, total })}</p>
                <div className="mt-1">
                  <ProgressBar value={percent} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
