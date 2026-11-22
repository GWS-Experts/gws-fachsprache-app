import { getTranslations } from "next-intl/server";
import { getMistakeOverview } from "@/lib/mistakes-data";

// Für GWS auf der Kundenseite: Stand im Fehlertrainer und die häufigsten offenen Fehler.
export async function StaffMistakes({ customerId }: { customerId: string }) {
  const t = await getTranslations("mistakes");
  const overview = await getMistakeOverview(customerId);
  if (!overview.available) return null;
  const top = [...overview.open].sort((a, b) => b.wrong_count - a.wrong_count || b.last_wrong_at.localeCompare(a.last_wrong_at)).slice(0, 8);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-bold text-primary">{t("staffTitle")}</h2>
        <p className="text-sm text-muted">{t("staffSummary", { open: overview.open.length, mastered: overview.masteredCount })}</p>
      </div>
      {top.length === 0 ? (
        <p className="card text-sm text-muted">{t("staffNone")}</p>
      ) : (
        <div className="card space-y-3">
          <p className="text-sm font-semibold">{t("staffTop")}</p>
          <ul className="divide-y divide-line text-sm">
            {top.map((m) => {
              const q = m.question;
              const right = q.type === "mc" ? q.options[q.answer] : q.answer;
              const title = m.lesson_id ? overview.lessonTitles[m.lesson_id]?.de : undefined;
              return (
                <li key={m.id} className="py-2">
                  <p className="text-xs text-muted">
                    {title ? t(`source.${m.source}`, { title }) : t(`sourceShort.${m.source}`)} · {t("wrongTimes", { count: m.wrong_count })}
                  </p>
                  <p className="font-semibold">{q.prompt}</p>
                  <p className="text-success">{t("staffAnswer")}: {right}</p>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
