"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { createGlossaryTopic, importGlossaryTerms, saveGlossaryTerm, updateGlossaryTopic } from "@/app/actions/glossary";
import { FormMessage } from "@/components/FormMessage";
import type { GlossaryTerm, GlossaryTopic } from "@/lib/types";

export function GlossaryTopicForm({ topic }: { topic?: GlossaryTopic }) {
  const t = useTranslations("glossaryAdmin");
  const [state, action, pending] = useActionState(topic ? updateGlossaryTopic : createGlossaryTopic, undefined);

  return (
    <form action={action} className="card space-y-4">
      <h2 className="font-bold text-primary">{topic ? t("editTopic") : t("newTopic")}</h2>
      <FormMessage error={state?.error ? t("error") : null} success={state?.success ? t("saved") : null} />
      {topic && <input type="hidden" name="id" value={topic.id} />}
      <div className="grid gap-4 sm:grid-cols-[6rem_1fr_1fr]">
        <div>
          <label className="label" htmlFor="gt-icon">{t("icon")}</label>
          <input className="input text-center" id="gt-icon" name="icon" defaultValue={topic?.icon ?? "📘"} maxLength={8} />
        </div>
        <div>
          <label className="label" htmlFor="gt-title-de">{t("titleDe")}</label>
          <input className="input" id="gt-title-de" name="title_de" defaultValue={topic?.title_de} required />
        </div>
        <div>
          <label className="label" htmlFor="gt-title-en">{t("titleEn")}</label>
          <input className="input" id="gt-title-en" name="title_en" defaultValue={topic?.title_en} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="gt-desc-de">{t("descriptionDe")}</label>
          <textarea className="input min-h-20" id="gt-desc-de" name="description_de" defaultValue={topic?.description_de} />
        </div>
        <div>
          <label className="label" htmlFor="gt-desc-en">{t("descriptionEn")}</label>
          <textarea className="input min-h-20" id="gt-desc-en" name="description_en" defaultValue={topic?.description_en} />
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-6">
        <div>
          <label className="label" htmlFor="gt-sort">{t("sort")}</label>
          <input className="input w-24" id="gt-sort" name="sort" type="number" min={0} defaultValue={topic?.sort ?? 0} />
        </div>
        <label className="flex items-center gap-2 pb-3 text-sm font-semibold">
          <input type="checkbox" name="published" defaultChecked={topic?.published ?? true} className="h-4 w-4 accent-[var(--gws-primary)]" />
          {t("published")}
        </label>
      </div>
      <button className="btn-primary" disabled={pending}>{topic ? t("save") : t("create")}</button>
    </form>
  );
}

export function GlossaryTermForm({ topicId, term }: { topicId: string; term?: GlossaryTerm }) {
  const t = useTranslations("glossaryAdmin");
  const [state, action, pending] = useActionState(saveGlossaryTerm, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success && !term) formRef.current?.reset();
  }, [state, term]);

  const id = term?.id ?? "new";
  return (
    <form ref={formRef} action={action} className="space-y-3">
      <FormMessage error={state?.error ? t(state.error === "duplicate" ? "duplicate" : "error") : null} success={state?.success ? t("saved") : null} />
      <input type="hidden" name="topic_id" value={topicId} />
      {term && <input type="hidden" name="id" value={term.id} />}
      <div className="grid gap-3 sm:grid-cols-[7rem_1fr_1fr_6rem]">
        <div>
          <label className="label" htmlFor={`a-${id}`}>{t("article")}</label>
          <select className="input" id={`a-${id}`} name="article" defaultValue={term?.article ?? ""}>
            <option value="">–</option>
            <option value="der">der</option>
            <option value="die">die</option>
            <option value="das">das</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor={`t-${id}`}>{t("term")}</label>
          <input className="input" id={`t-${id}`} name="term" defaultValue={term?.term} required />
        </div>
        <div>
          <label className="label" htmlFor={`p-${id}`}>{t("plural")}</label>
          <input className="input" id={`p-${id}`} name="plural" defaultValue={term?.plural} placeholder="die …" />
        </div>
        <div>
          <label className="label" htmlFor={`s-${id}`}>{t("sort")}</label>
          <input className="input" id={`s-${id}`} name="sort" type="number" min={0} defaultValue={term?.sort} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`e-${id}`}>{t("explanation")}</label>
          <textarea className="input min-h-16" id={`e-${id}`} name="explanation" defaultValue={term?.explanation} />
        </div>
        <div>
          <label className="label" htmlFor={`en-${id}`}>{t("en")}</label>
          <input className="input" id={`en-${id}`} name="en" defaultValue={term?.en} />
          <label className="label mt-3" htmlFor={`x-${id}`}>{t("example")}</label>
          <input className="input" id={`x-${id}`} name="example" defaultValue={term?.example} />
        </div>
      </div>
      <button className="btn-primary" disabled={pending}>{term ? t("save") : t("addTerm")}</button>
    </form>
  );
}

export function GlossaryImportForm({ topicId }: { topicId: string }) {
  const t = useTranslations("glossaryAdmin");
  const [state, action, pending] = useActionState(importGlossaryTerms, undefined);
  const error = state?.error === "importLine" ? t("importLineError", { line: state.line ?? "" }) : state?.error ? t("error") : null;

  return (
    <form action={action} className="card space-y-3">
      <h2 className="font-bold text-primary">{t("importTitle")}</h2>
      <p className="text-sm text-muted">{t("importIntro")}</p>
      <pre className="overflow-x-auto rounded-md bg-page p-3 text-xs">die; Anamnese; die Anamnesen; Krankengeschichte; medical history; Ich erhebe die Anamnese.</pre>
      <FormMessage error={error} success={state?.success ? t("imported", { count: state.count ?? 0 }) : null} />
      <input type="hidden" name="topic_id" value={topicId} />
      <textarea className="input min-h-32 font-mono text-sm" name="lines" aria-label={t("importTitle")} required />
      <button className="btn-accent" disabled={pending}>{t("importSubmit")}</button>
    </form>
  );
}
