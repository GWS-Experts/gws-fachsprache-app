"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { saveExamReview } from "@/app/actions/exam";

export function ExamReviewForm({ attemptId, comment, parts }: { attemptId: string; comment: string; parts: { id: string; title: string; max: number; points: number | null; submitted: boolean }[] }) {
  const t = useTranslations("examAdmin");
  const [state, action, pending] = useActionState(saveExamReview, undefined);
  return (
    <form action={action} className="card space-y-4 border-accent">
      <input type="hidden" name="attempt_id" value={attemptId} />
      <h2 className="font-bold text-primary">{t("reviewTitle")}</h2>
      <p className="text-sm text-muted">{t("reviewIntro")}</p>
      {parts.map((p) => (
        <label key={p.id} className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-semibold">
            {p.title}
            {!p.submitted && <span className="ml-2 badge bg-page text-muted">{t("notSubmitted")}</span>}
          </span>
          <span className="flex items-center gap-2 text-sm">
            <input name={`points_${p.id}`} type="number" min={0} max={p.max} defaultValue={p.points ?? ""} disabled={!p.submitted} className="input w-24" />/ {p.max}
          </span>
        </label>
      ))}
      <label className="block">
        <span className="label">{t("comment")}</span>
        <textarea name="comment" defaultValue={comment} className="input min-h-24" placeholder={t("commentPlaceholder")} />
      </label>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm">
          {state?.success && <span className="text-success">{t("saved")}</span>}
          {state?.error && <span className="text-danger">{state.error === "points" ? t("pointsError") : t("error")}</span>}
        </span>
        <button className="btn-primary" disabled={pending}>{t("saveReview")}</button>
      </div>
    </form>
  );
}
