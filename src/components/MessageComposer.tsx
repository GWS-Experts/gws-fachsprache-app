"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { sendMessage } from "@/app/actions/messages";

export function MessageComposer({ customerId, lessonId, lessonTitle, placeholder }: { customerId: string; lessonId?: string; lessonTitle?: string; placeholder: string }) {
  const t = useTranslations("messages");
  const [state, action, pending] = useActionState(sendMessage, undefined);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) form.current?.reset();
  }, [state]);

  return (
    <form ref={form} action={action} className="space-y-2 border-t border-line pt-4">
      <input type="hidden" name="customerId" value={customerId} />
      {lessonId && <input type="hidden" name="lessonId" value={lessonId} />}
      {lessonTitle && <p className="text-xs font-semibold text-accent">{t("aboutLesson")}: {lessonTitle}</p>}
      <label className="sr-only" htmlFor="body">{placeholder}</label>
      <textarea id="body" name="body" required maxLength={5000} className="input min-h-24" placeholder={placeholder} />
      <div className="flex items-center justify-between gap-3">
        {state?.error ? <p className="text-sm text-danger">{t("error")}</p> : <span />}
        <button className="btn-primary" disabled={pending}>{pending ? t("sending") : t("send")}</button>
      </div>
    </form>
  );
}
