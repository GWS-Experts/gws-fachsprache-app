import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAttempts, getExamParts, getExams } from "@/lib/exam-data";
import { summarize, totalMinutes } from "@/lib/exam";
import type { Profile } from "@/lib/types";
import { NewExamForm } from "@/components/exam/ExamAdminForms";

export default async function AdminExamsPage({ searchParams }: { searchParams: Promise<{ customer?: string }> }) {
  await requireStaff();
  const { customer } = await searchParams;
  const t = await getTranslations("examAdmin");
  const te = await getTranslations("exam");
  const supabase = await createClient();
  const [exams, attempts, { data: profiles }] = await Promise.all([
    getExams(),
    getAttempts({ userId: customer, limit: 300 }),
    supabase.from("profiles").select("id, first_name, last_name, email"),
  ]);
  const partsByExam = new Map(await Promise.all(exams.map(async (e) => [e.id, await getExamParts(e, true)] as const)));
  const names = new Map(((profiles ?? []) as Profile[]).map((p) => [p.id, `${p.first_name} ${p.last_name}`.trim() || p.email]));
  const examById = new Map(exams.map((e) => [e.id, e]));
  const fmt = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-primary">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("intro")}</p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {exams.map((e) => {
          const parts = partsByExam.get(e.id) ?? [];
          return (
            <li key={e.id}>
              <Link href={`/admin/exams/${e.id}`} className="card flex h-full flex-col hover:border-primary">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-bold text-primary">{e.title_de}</h2>
                  <span className={`badge ${e.published ? "bg-success-light text-success" : "bg-page text-muted"}`}>{e.published ? t("published") : t("draft")}</span>
                </div>
                <p className="mt-1 flex-1 text-sm text-muted">{e.description_de}</p>
                <p className="mt-3 text-xs font-semibold text-muted">
                  {te("partsCount", { count: parts.length })} · {te("minutes", { count: totalMinutes(parts) })}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
      <NewExamForm />

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-xl font-bold text-primary">{customer ? t("attemptsOf", { name: names.get(customer) ?? "" }) : t("attempts")}</h2>
          {customer && <Link href="/admin/exams" className="text-sm text-primary underline">{t("allAttempts")}</Link>}
        </div>
        {attempts.length === 0 ? (
          <p className="card text-sm text-muted">{t("noAttempts")}</p>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="bg-primary-light text-left text-primary">
                <tr>
                  <th className="px-4 py-2">{t("customer")}</th>
                  <th className="px-4 py-2">{t("exam")}</th>
                  <th className="px-4 py-2">{t("date")}</th>
                  <th className="px-4 py-2 text-right">{t("result")}</th>
                  <th className="px-4 py-2">{t("status")}</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => {
                  const exam = examById.get(a.exam_id);
                  const parts = partsByExam.get(a.exam_id) ?? [];
                  const s = exam ? summarize(a, parts.filter((p) => p.published), exam.pass_percent) : null;
                  const status = !a.finished_at ? "running" : s?.passed === null ? "review" : s?.passed ? "passed" : "failed";
                  const style = { running: "bg-page text-muted", review: "bg-accent-light text-accent", passed: "bg-success-light text-success", failed: "bg-danger-light text-danger" }[status];
                  return (
                    <tr key={a.id} className="border-t border-line">
                      <td className="px-4 py-2">
                        <Link href={`/admin/exams?customer=${a.user_id}`} className="hover:underline">{names.get(a.user_id) ?? "–"}</Link>
                      </td>
                      <td className="px-4 py-2">{exam?.title_de ?? "–"}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{fmt.format(new Date(a.started_at))}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{a.finished_at && s ? `${s.total.percent ?? 0} %` : "–"}</td>
                      <td className="px-4 py-2">
                        {a.finished_at ? (
                          <Link href={`/admin/exams/attempt/${a.id}`} className={`badge ${style} hover:underline`}>{t(`status_${status}`)}</Link>
                        ) : (
                          <span className={`badge ${style}`}>{t(`status_${status}`)}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
