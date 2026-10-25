"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { updateCustomer } from "@/app/actions/admin";
import { FormMessage } from "@/components/FormMessage";
import type { Profile } from "@/lib/types";

export function CustomerDataForm({ customer }: { customer: Profile }) {
  const t = useTranslations("customer");
  const [state, action, pending] = useActionState(updateCustomer, undefined);
  return (
    <form action={action} className="card grid gap-4 sm:grid-cols-[1fr_1fr_1.4fr_auto] sm:items-end">
      <input type="hidden" name="id" value={customer.id} />
      <div>
        <label className="label" htmlFor="c-first">{t("firstName")}</label>
        <input className="input" id="c-first" name="first_name" defaultValue={customer.first_name} required />
      </div>
      <div>
        <label className="label" htmlFor="c-last">{t("lastName")}</label>
        <input className="input" id="c-last" name="last_name" defaultValue={customer.last_name} required />
      </div>
      <div>
        <label className="label" htmlFor="c-email">{t("email")}</label>
        <input className="input bg-page" id="c-email" value={customer.email} readOnly />
      </div>
      <button className="btn-outline" disabled={pending}>{t("save")}</button>
      <div className="sm:col-span-4">
        <FormMessage error={state?.error ? t("error") : null} success={state?.success ? t("saved") : null} />
      </div>
    </form>
  );
}
