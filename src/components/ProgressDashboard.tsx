import Link from "next/link";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { formatDuration, type LearningStats } from "@/lib/data";
import { pick, type Locale } from "@/lib/types";
import { ProgressBar } from "@/components/ProgressBar";
import { KindBadge } from "@/components/KindBadge";

export async function ProgressDashboard({ stats, lessonHref }: { stats: LearningStats; lessonHref: (id: string) => string }) {
  const t = await getTranslations("progress");
  const tk = await getTranslations("kinds");
  const format = await getFormatter();
  const locale = (await getLocale()) as Locale;

  const tiles = [
    { label: t("overall"), value: `${stats.percent}%`, sub: t("lessonsDone", { done: stats.doneLessons, total: stats.totalLessons }) },
    { label: t("avgScore"), value: stats.avgScore === null ? "–" : `${stats.avgScore}%`, sub: t("avgScoreHint") },
    { label: t("timeSpent"), value: formatDuration(stats.totalSeconds), sub: t("timeSpentHint") },
    {
      label: t("lastActivity"),
      value: stats.lastActivity ? format.dateTime(new Date(stats.lastActivity), { dateStyle: "medium" }) : "–",
      sub: stats.lastActivity ? format.relativeTime(new Date(stats.lastActivity)) : t("never"),
    },
  ];

  return (
    <div className="space-y-6">
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <li key={tile.label} className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{tile.label}</p>
            <p className="mt-1 text-2xl font-bold text-primary">{tile.value}</p>
            <p className="mt-0.5 text-xs text-muted">{tile.sub}</p>
          </li>
        ))}
      </ul>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card space-y-4">
          <h2 className="font-bold text-primary">{t("byModule")}</h2>
          {stats.modules.map(({ module, done, total, percent }) => (
            <div key={module.id}>
              <p className="mb-1 flex justify-between text-sm">
                <span className="font-semibold">{pick(module, "title", locale)}</span>
                <span className="text-muted">{done}/{total}</span>
              </p>
              <ProgressBar value={percent} />
            </div>
          ))}
        </section>

        <section className="card space-y-3">
          <h2 className="font-bold text-primary">{t("byKind")}</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-muted">
                <th className="pb-2">{t("kind")}</th>
                <th className="pb-2 text-right">{t("attempts")}</th>
                <th className="pb-2 text-right">{t("score")}</th>
              </tr>
            </thead>
            <tbody>
              {stats.kinds.map((k) => (
                <tr key={k.kind} className="border-t border-line">
                  <td className="py-2">{tk(k.kind)}</td>
                  <td className="py-2 text-right">{k.attempts}</td>
                  <td className="py-2 text-right font-semibold">{k.scorePercent === null ? "–" : `${k.scorePercent}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      {stats.weakLessons.length > 0 && (
        <section className="card space-y-3">
          <h2 className="font-bold text-primary">{t("weak")}</h2>
          <ul className="space-y-2">
            {stats.weakLessons.map(({ lesson, percent }) => (
              <li key={lesson.id} className="flex items-center justify-between gap-3 text-sm">
                <Link href={lessonHref(lesson.id)} className="text-primary underline">{pick(lesson, "title", locale)}</Link>
                <span className="font-semibold text-danger">{percent}%</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card space-y-3">
        <h2 className="font-bold text-primary">{t("recent")}</h2>
        {stats.recent.length === 0 ? (
          <p className="text-sm text-muted">{t("none")}</p>
        ) : (
          <ul className="divide-y divide-line">
            {stats.recent.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span className="flex items-center gap-2">
                  {p.lesson && <KindBadge kind={p.lesson.kind} />}
                  {p.lesson ? pick(p.lesson, "title", locale) : "–"}
                </span>
                <span className="text-muted">
                  {p.max_score > 0 ? `${p.score}/${p.max_score} · ` : ""}
                  {format.dateTime(new Date(p.completed_at), { dateStyle: "short", timeStyle: "short" })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
