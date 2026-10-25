"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { createLesson } from "@/app/actions/content";
import { LESSON_KINDS } from "@/lib/types";

export function NewLessonForm({ moduleId }: { moduleId: string }) {
  const t = useTranslations("content");
  const tk = useTranslations("kinds");
  const [state, action, pending] = useActionState(createLesson, undefined);
  return (
    <form action={action} className="card grid gap-4 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
      <input type="hidden" name="module_id" value={moduleId} />
      <h2 className="font-bold text-primary sm:col-span-3">{t("newLesson")}</h2>
      <div>
        <label className="label" htmlFor="l-kind">{t("kind")}</label>
        <select className="input" id="l-kind" name="kind" defaultValue="quiz">
          {LESSON_KINDS.map((k) => <option key={k} value={k}>{tk(k)}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="l-title">{t("titleDe")}</label>
        <input className="input" id="l-title" name="title_de" required />
      </div>
      <button className="btn-accent" disabled={pending}>{t("create")}</button>
      {state?.error && <p className="text-sm text-danger sm:col-span-3">{t("error")}</p>}
    </form>
  );
}
