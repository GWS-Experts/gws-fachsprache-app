"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { createExam, updateExam } from "@/app/actions/exam";
import type { Exam } from "@/lib/exam";

export function NewExamForm() {
  const t = useTranslations("examAdmin");
  const [state, action, pending] = useActionState(createExam, undefined);
  return (
    <form action={action} className="card flex flex-wrap items-end gap-3">
      <label className="block min-w-60 flex-1">
        <span className="label">{t("newExam")}</span>
        <input name="title_de" required className="input" placeholder={t("newExamPlaceholder")} />
      </label>
      <button className="btn-primary" disabled={pending}>{t("create")}</button>
      {state?.error && <p className="w-full text-sm text-danger">{t("error")}</p>}
    </form>
  );
}

export function ExamForm({ exam }: { exam: Exam }) {
  const t = useTranslations("examAdmin");
  const [state, action, pending] = useActionState(updateExam, undefined);
  return (
    <form action={action} className="card grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="id" value={exam.id} />
      <label className="block"><span className="label">{t("titleDe")}</span><input name="title_de" required defaultValue={exam.title_de} className="input" /></label>
      <label className="block"><span className="label">{t("titleEn")}</span><input name="title_en" defaultValue={exam.title_en} className="input" /></label>
      <label className="block"><span className="label">{t("descriptionDe")}</span><textarea name="description_de" defaultValue={exam.description_de} className="input min-h-24" /></label>
      <label className="block"><span className="label">{t("descriptionEn")}</span><textarea name="description_en" defaultValue={exam.description_en} className="input min-h-24" /></label>
      <div className="flex flex-wrap items-end gap-6 sm:col-span-2">
        <label className="block"><span className="label">{t("passPercent")}</span><input name="pass_percent" type="number" min={0} max={100} defaultValue={exam.pass_percent} className="input w-24" /></label>
        <label className="block"><span className="label">{t("sort")}</span><input name="sort" type="number" min={0} defaultValue={exam.sort} className="input w-24" /></label>
        <label className="flex items-center gap-2 pb-3 text-sm font-semibold">
          <input name="published" type="checkbox" defaultChecked={exam.published} className="h-4 w-4 accent-[var(--gws-primary)]" />
          {t("published")}
        </label>
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button className="btn-primary" disabled={pending}>{t("save")}</button>
        {state?.success && <span className="text-sm text-success">{t("saved")}</span>}
        {state?.error && <span className="text-sm text-danger">{t("error")}</span>}
      </div>
    </form>
  );
}
