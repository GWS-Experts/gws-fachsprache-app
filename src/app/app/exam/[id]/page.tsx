import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { requireCustomer } from "@/lib/auth";
import { getExam, getExamParts } from "@/lib/exam-data";
import { areaOf, isManual, partMax, partMinutes, totalMinutes } from "@/lib/exam";
import { pick, type Locale } from "@/lib/types";
import { startExam } from "@/app/actions/exam";

export default async function ExamIntroPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { error } = await searchParams;
  await requireCustomer();
  const t = await getTranslations("exam");
  const locale = (await getLocale()) as Locale;
  const exam = await getExam(id);
  if (!exam || !exam.published) notFound();
  const parts = await getExamParts(exam);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/app/exam" className="text-sm font-semibold text-primary hover:underline">← {t("allExams")}</Link>
      <header>
        <h1 className="text-2xl font-bold text-primary">{pick(exam, "title", locale)}</h1>
        <p className="mt-2 whitespace-pre-line text-muted">{pick(exam, "description", locale)}</p>
      </header>

      <section className="card space-y-3">
        <h2 className="font-bold text-primary">{t("howItWorks")}</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>{t("rule1", { minutes: totalMinutes(parts) })}</li>
          <li>{t("rule2")}</li>
          <li>{t("rule3")}</li>
          <li>{t("rule4", { percent: exam.pass_percent })}</li>
          <li>{t("rule5")}</li>
        </ul>
      </section>

      <section className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-primary-light text-left text-primary">
            <tr>
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">{t("part")}</th>
              <th className="px-4 py-2">{t("area")}</th>
              <th className="px-4 py-2 text-right">{t("time")}</th>
              <th className="px-4 py-2 text-right">{t("points")}</th>
            </tr>
          </thead>
          <tbody>
            {parts.map((p, i) => (
              <tr key={p.id} className="border-t border-line">
                <td className="px-4 py-2 text-muted">{i + 1}</td>
                <td className="px-4 py-2 font-semibold">{pick(p, "title", locale)}</td>
                <td className="px-4 py-2">{t(`areas.${areaOf(p)}`)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{t("minutesShort", { count: partMinutes(p) })}</td>
                <td className="px-4 py-2 text-right tabular-nums">{partMax(p)}{isManual(p) ? " *" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="px-4 py-2 text-xs text-muted">* {t("manualHint")}</p>
      </section>

      {error && <p className="card text-sm text-danger">{t("startError")}</p>}
      <form action={startExam} className="card flex flex-wrap items-center justify-between gap-3 border-accent">
        <input type="hidden" name="exam_id" value={exam.id} />
        <p className="text-sm">{t("readyHint")}</p>
        <button className="btn-accent" disabled={parts.length === 0}>▶ {t("startNow")}</button>
      </form>
    </div>
  );
}
