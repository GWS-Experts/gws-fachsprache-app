"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { createModule, updateModule } from "@/app/actions/content";
import { FormMessage } from "@/components/FormMessage";
import type { Module } from "@/lib/types";

export function ModuleForm({ module }: { module?: Module }) {
  const t = useTranslations("content");
  const [state, action, pending] = useActionState(module ? updateModule : createModule, undefined);

  return (
    <form action={action} className="card space-y-4">
      <h2 className="font-bold text-primary">{module ? t("editModule") : t("newModule")}</h2>
      <FormMessage error={state?.error ? t("error") : null} success={state?.success ? t("saved") : null} />
      {module && <input type="hidden" name="id" value={module.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="m-title-de">{t("titleDe")}</label>
          <input className="input" id="m-title-de" name="title_de" defaultValue={module?.title_de} required />
        </div>
        <div>
          <label className="label" htmlFor="m-title-en">{t("titleEn")}</label>
          <input className="input" id="m-title-en" name="title_en" defaultValue={module?.title_en} />
        </div>
        <div>
          <label className="label" htmlFor="m-desc-de">{t("descriptionDe")}</label>
          <textarea className="input min-h-20" id="m-desc-de" name="description_de" defaultValue={module?.description_de} />
        </div>
        <div>
          <label className="label" htmlFor="m-desc-en">{t("descriptionEn")}</label>
          <textarea className="input min-h-20" id="m-desc-en" name="description_en" defaultValue={module?.description_en} />
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-6">
        <div>
          <label className="label" htmlFor="m-sort">{t("sort")}</label>
          <input className="input w-24" id="m-sort" name="sort" type="number" min={0} defaultValue={module?.sort ?? 0} />
        </div>
        <label className="flex items-center gap-2 pb-3 text-sm font-semibold">
          <input type="checkbox" name="published" defaultChecked={module?.published} className="h-4 w-4 accent-[var(--gws-primary)]" />
          {t("published")}
        </label>
      </div>
      <button className="btn-primary" disabled={pending}>{module ? t("save") : t("create")}</button>
    </form>
  );
}
