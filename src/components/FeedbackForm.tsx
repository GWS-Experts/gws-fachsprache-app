"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { saveFeedback } from "@/app/actions/admin";

export function FeedbackForm({ id, initial }: { id: string; initial: string }) {
  const t = useTranslations("feedback");
  const [state, action, pending] = useActionState(saveFeedback, undefined);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <label className="label" htmlFor={`fb-${id}`}>{t("label")}</label>
      <textarea id={`fb-${id}`} name="feedback" defaultValue={initial} required className="input min-h-24" placeholder={t("placeholder")} />
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm">
          {state?.success && <span className="text-success">{t("saved")}</span>}
          {state?.error && <span className="text-danger">{t("error")}</span>}
          {!state && !initial && <span className="badge bg-accent-light text-accent">{t("pending")}</span>}
        </span>
        <button className="btn-primary" disabled={pending}>{t("save")}</button>
      </div>
    </form>
  );
}
