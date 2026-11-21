"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { deleteCustomer } from "@/app/actions/privacy";
import { FormMessage } from "@/components/FormMessage";

// Gefahrenbereich auf der Kundenseite: alle Trainingsdaten endgültig löschen.
export function DeleteCustomerForm({ customerId, email }: { customerId: string; email: string }) {
  const t = useTranslations("privacy");
  const [state, action, pending] = useActionState(deleteCustomer, undefined);
  const [typed, setTyped] = useState("");
  const matches = typed.trim().toLowerCase() === email.toLowerCase();

  return (
    <section id="delete" className="space-y-3">
      <h2 className="text-xl font-bold text-danger">{t("deleteTitle")}</h2>
      <form action={action} className="card space-y-3 border-danger/40">
        <p className="text-sm">{t("deleteIntro")}</p>
        <ul className="ml-5 list-disc text-sm text-muted">
          <li>{t("deleteWhat")}</li>
          <li>{t("deleteKeeps")}</li>
        </ul>
        <FormMessage error={state?.error ? t(`deleteErrors.${state.error}`) : null} />
        <input type="hidden" name="id" value={customerId} />
        <div>
          <label className="label" htmlFor="confirm-delete">{t("deleteConfirmLabel", { email })}</label>
          <input
            className="input"
            id="confirm-delete"
            name="confirm"
            autoComplete="off"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={email}
          />
        </div>
        <button className="btn-danger" disabled={!matches || pending}>
          {pending ? t("deleting") : t("deleteButton")}
        </button>
      </form>
    </section>
  );
}
