import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { requireCustomer } from "@/lib/auth";
import { getAttempts, getExamParts, getExams } from "@/lib/exam-data";
import { summarize, totalMinutes } from "@/lib/exam";
import { pick, type Locale } from "@/lib/types";

export default async function ExamListPage() {
  const profile = await requireCustomer();
  const t = await getTranslations("exam");
  const locale = (await getLocale()) as Locale;
  const [exams, attempts] = await Promise.all([getExams(), getAttempts({ userId: profile.id })]);
  const partsByExam = new Map(await Promise.all(exams.map(async (e) => [e.id, await getExamParts(e)] as const)));
  const fmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "de-DE", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-gradient-to-br from-primary to-accent p-6 text-white">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="mt-2 max-w-2xl text-sm opacity-90">{t("intro")}</p>
      </section>

      {exams.length === 0 && <p className="card text-muted">{t("empty")}</p>}

      <ul className="grid gap-4 md:grid-cols-2">
        {exams.map((exam) => {
          const parts = partsByExam.get(exam.id) ?? [];
          const mine = attempts.filter((a) => a.exam_id === exam.id);
          const running = mine.find((a) => !a.finished_at);
          return (
            <li key={exam.id} className="card flex flex-col gap-3">
              <div>
                <h2 className="text-lg font-bold text-primary">{pick(exam, "title", locale)}</h2>
                <p className="mt-1 whitespace-pre-line text-sm text-muted">{pick(exam, "description", locale)}</p>
              </div>
              <p className="text-sm">
                <span className="badge mr-2 bg-primary-light text-primary">⏱ {t("minutes", { count: totalMinutes(parts) })}</span>
                <span className="badge bg-primary-light text-primary">{t("partsCount", { count: parts.length })}</span>
              </p>
              {mine.filter((a) => a.finished_at).length > 0 && (
                <ul className="space-y-1 text-sm">
                  {mine
                    .filter((a) => a.finished_at)
                    .slice(0, 5)
                    .map((a) => {
                      const s = summarize(a, parts, exam.pass_percent);
                      return (
                        <li key={a.id}>
                          <Link href={`/app/exam/attempt/${a.id}`} className="flex items-center justify-between gap-3 rounded-md border border-line px-3 py-2 hover:border-primary">
                            <span className="text-muted">{fmt.format(new Date(a.started_at))}</span>
                            <span className="font-semibold">
                              {s.total.percent ?? 0} %{" "}
                              {s.passed === null ? <span className="badge bg-accent-light text-accent">{t("statusPending")}</span> : s.passed ? <span className="badge bg-success-light text-success">{t("statusPassed")}</span> : <span className="badge bg-danger-light text-danger">{t("statusFailed")}</span>}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                </ul>
              )}
              <div className="mt-auto">
                <Link href={running ? `/app/exam/attempt/${running.id}` : `/app/exam/${exam.id}`} className={running ? "btn-accent" : "btn-primary"}>
                  {running ? t("continue") : mine.length ? t("startAgain") : t("start")}
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
