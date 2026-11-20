"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { createFeedbackDraft, saveFeedback, type DraftState } from "@/app/actions/admin";

// Feedback zu einer Abgabe. Liegt ein KI-Vorschlag vor und gibt es noch kein
// Feedback, wird der Vorschlag vorausgefüllt. Erst "Freigeben" macht ihn für
// den Kunden sichtbar.
export function FeedbackForm({ id, initial, draft = "", canDraft = false }: { id: string; initial: string; draft?: string; canDraft?: boolean }) {
  const t = useTranslations("feedback");
  const [state, action, pending] = useActionState(saveFeedback, undefined);
  const [value, setValue] = useState(initial || draft);
  const [fromAi, setFromAi] = useState(!initial && Boolean(draft));
  const [draftState, draftAction, drafting] = useActionState(async (prev: DraftState, formData: FormData) => {
    const result = await createFeedbackDraft(prev, formData);
    if (result?.draft) {
      setValue(result.draft);
      setFromAi(true);
    }
    return result;
  }, undefined);

  const released = Boolean(initial) || Boolean(state?.success);

  return (
    <div className="space-y-2">
      <form action={action} className="space-y-2">
        <input type="hidden" name="id" value={id} />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="label" htmlFor={`fb-${id}`}>{t("label")}</label>
          {fromAi && !released && <span className="badge bg-primary-light text-primary">🤖 {t("aiBadge")}</span>}
        </div>
        {fromAi && !released && <p className="text-xs text-muted">{t("aiHint")}</p>}
        <textarea
          id={`fb-${id}`}
          name="feedback"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
          className={`input ${fromAi ? "min-h-64" : "min-h-24"}`}
          placeholder={t("placeholder")}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm">
            {state?.success && <span className="text-success">{t("saved")}</span>}
            {state?.error && <span className="text-danger">{t("error")}</span>}
            {draftState?.error && <span className="text-danger">{t(`aiErrors.${draftState.error}`)}</span>}
            {!state && !draftState?.error && !initial && <span className="badge bg-accent-light text-accent">{t("pending")}</span>}
          </span>
          <div className="flex flex-wrap gap-2">
            {canDraft && (
              <button type="submit" form={`ai-${id}`} className="btn-outline" disabled={drafting}>
                {drafting ? t("aiWorking") : draft || fromAi ? t("aiRedo") : t("aiCreate")}
              </button>
            )}
            <button className="btn-primary" disabled={pending || drafting}>{fromAi && !released ? t("release") : t("save")}</button>
          </div>
        </div>
      </form>
      {canDraft && (
        <form id={`ai-${id}`} action={draftAction}>
          <input type="hidden" name="id" value={id} />
        </form>
      )}
    </div>
  );
}
