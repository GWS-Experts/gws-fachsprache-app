import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import type { StudyOverview } from "@/lib/study-data";

const minutes = (s: number) => Math.round(s / 60);

// Tagesziel, Serie und die letzten 14 Tage. compact = kleine Karte für die Startseite.
export async function StudyToday({ overview, compact = false }: { overview: StudyOverview; compact?: boolean }) {
  const t = await getTranslations("plan");
  const locale = await getLocale();
  const { todaySeconds, goalSeconds, streak, plannedToday } = overview;
  const reached = todaySeconds >= goalSeconds;
  const pct = Math.min(100, Math.round((todaySeconds / goalSeconds) * 100));
  const status = reached ? t("goalReached") : plannedToday ? t("goalLeft", { min: Math.max(1, minutes(goalSeconds - todaySeconds)) }) : t("freeDay");

  if (compact) {
    return (
      <Link href="/app/plan" className="card flex flex-wrap items-center gap-4 transition hover:border-primary hover:shadow-md">
        <span aria-hidden className="text-3xl">{reached ? "✅" : "🎯"}</span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("today")}</p>
          <p className="font-bold text-primary">{t("minutesOf", { done: minutes(todaySeconds), goal: minutes(goalSeconds) })}</p>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-primary-light">
            <div className={`h-full rounded-full ${reached ? "bg-success" : "bg-accent"}`} style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-sm text-muted">{status}</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">🔥 {streak}</p>
          <p className="text-xs text-muted">{t("streakShort")}</p>
        </div>
      </Link>
    );
  }

  const max = Math.max(goalSeconds, ...overview.days.map((d) => d.seconds));
  const dayLabel = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" });

  return (
    <section className="card space-y-5">
      <div className="flex flex-wrap items-center gap-6">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("today")}</p>
          <p className="text-2xl font-bold text-primary">{t("minutesOf", { done: minutes(todaySeconds), goal: minutes(goalSeconds) })}</p>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-primary-light">
            <div className={`h-full rounded-full ${reached ? "bg-success" : "bg-accent"}`} style={{ width: `${pct}%` }} />
          </div>
          <p className={`mt-1.5 text-sm ${reached ? "font-semibold text-success" : "text-muted"}`}>{status}</p>
        </div>
        <div className="rounded-lg bg-accent-light px-5 py-3 text-center">
          <p className="text-3xl font-bold text-primary">🔥 {streak}</p>
          <p className="text-xs font-semibold text-muted">{t("streak", { count: streak })}</p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t("last14")}</p>
        <ol className="grid items-end gap-1" style={{ gridTemplateColumns: "repeat(14, minmax(0, 1fr))" }}>
          {overview.days.map((d) => {
            const ok = d.seconds >= goalSeconds;
            const h = d.seconds ? Math.max(8, Math.round((d.seconds / max) * 64)) : 4;
            const label = t("dayTitle", { min: minutes(d.seconds), lessons: d.lessons, cards: d.cards });
            return (
              <li key={d.day} className="flex flex-col items-center gap-1" title={`${d.day}: ${label}`}>
                <span className="flex h-16 w-full items-end justify-center">
                  <span
                    className={`w-full max-w-5 rounded-sm ${ok ? "bg-success" : d.seconds ? "bg-accent" : d.planned ? "bg-line" : "bg-transparent border border-dashed border-line"}`}
                    style={{ height: h }}
                  />
                </span>
                <span className={`text-[10px] ${d.day === overview.today ? "font-bold text-primary" : "text-muted"}`}>
                  {dayLabel.format(new Date(`${d.day}T12:00:00Z`)).slice(0, 2)}
                </span>
                <span className="sr-only">{label}</span>
              </li>
            );
          })}
        </ol>
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-success" />{t("legendReached")}</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-accent" />{t("legendSome")}</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-sm border border-dashed border-line" />{t("legendFree")}</span>
        </p>
      </div>
      <p className="text-xs text-muted">{t("howCounted")}</p>
    </section>
  );
}
