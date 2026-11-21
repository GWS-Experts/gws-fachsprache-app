"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { requestDeletion } from "@/app/actions/privacy";
import { FormMessage } from "@/components/FormMessage";

// Kunde kann im Profil die Löschung seiner Daten beantragen.
export function DeletionRequest() {
  const t = useTranslations("privacy");
  const [state, action, pending] = useActionState(requestDeletion, undefined);
  const [open, setOpen] = useState(false);

  return (
    <section className="card space-y-3">
      <h2 className="font-bold text-primary">{t("requestTitle")}</h2>
      <p className="text-sm text-muted">
        {t("requestIntro")}{" "}
        <Link href="/datenschutz" className="font-semibold text-accent hover:underline">{t("privacyLink")}</Link>
      </p>
      <FormMessage error={state?.error ? t("requestError") : null} success={state?.success ? t("requestSent") : null} />
      {!state?.success &&
        (open ? (
          <form action={action} className="space-y-3 rounded-md bg-danger-light p-3">
            <p className="text-sm text-danger">{t("requestConfirm")}</p>
            <div className="flex flex-wrap gap-2">
              <button className="btn-danger" disabled={pending}>{pending ? t("deleting") : t("requestButton")}</button>
              <button type="button" className="btn-outline" onClick={() => setOpen(false)}>{t("cancel")}</button>
            </div>
          </form>
        ) : (
          <button type="button" className="btn-outline" onClick={() => setOpen(true)}>{t("requestStart")}</button>
        ))}
    </section>
  );
}
