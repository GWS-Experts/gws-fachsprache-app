import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireStaff } from "@/lib/auth";
import { getExam, getExamParts } from "@/lib/exam-data";
import { areaOf, isManual, partMax, partMinutes, totalMinutes } from "@/lib/exam";
import { ExamForm } from "@/components/exam/ExamAdminForms";
import { KindBadge } from "@/components/KindBadge";

export default async function AdminExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireStaff();
  const t = await getTranslations("examAdmin");
  const te = await getTranslations("exam");
  const exam = await getExam(id);
  if (!exam) notFound();
  const parts = await getExamParts(exam, true);
  const live = parts.filter((p) => p.published);

  return (
    <div className="space-y-6">
      <Link href="/admin/exams" className="text-sm font-semibold text-primary hover:underline">← {t("allExams")}</Link>
      <h1 className="text-2xl font-bold text-primary">{exam.title_de}</h1>
      <ExamForm exam={exam} />

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-primary">{t("parts")}</h2>
            <p className="text-sm text-muted">{t("partsIntro", { minutes: totalMinutes(live) })}</p>
          </div>
          <Link href={`/admin/content/${exam.module_id}`} className="btn-outline">{t("editParts")}</Link>
        </div>
        <ol className="space-y-2">
          {parts.map((p, i) => (
            <li key={p.id}>
              <Link href={`/admin/content/lesson/${p.id}`} className="card flex flex-wrap items-center gap-4 py-3 hover:border-primary">
                <span className="w-6 text-center text-sm font-bold text-muted">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{p.title_de}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <KindBadge kind={p.kind} />
                    <span className="badge bg-primary-light text-primary">{te(`areas.${areaOf(p)}`)}</span>
                  </div>
                </div>
                <span className="text-sm tabular-nums text-muted">
                  ⏱ {te("minutesShort", { count: partMinutes(p) })} · {partMax(p)} {te("points")}
                  {isManual(p) ? " *" : ""}
                </span>
                {!p.published && <span className="badge bg-page text-muted">{t("draft")}</span>}
              </Link>
            </li>
          ))}
        </ol>
        <p className="text-xs text-muted">* {te("manualHint")}</p>
      </section>
    </div>
  );
}
