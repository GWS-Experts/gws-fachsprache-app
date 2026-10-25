"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { inviteUser } from "@/app/actions/admin";
import { FormMessage } from "@/components/FormMessage";

export function InviteForm() {
  const t = useTranslations("invite");
  const [state, action, pending] = useActionState(inviteUser, undefined);

  return (
    <form action={action} className="card space-y-4">
      <div>
        <h2 className="font-bold text-primary">{t("title")}</h2>
        <p className="mt-1 text-sm text-muted">{t("intro")}</p>
      </div>
      <FormMessage error={state?.error ? t(`errors.${state.error}` as "errors.generic") : null} success={state?.success ? t(`results.${state.success}` as "results.sent") : null} />
      {state?.link && (
        <div className="space-y-1">
          <label className="label" htmlFor="invite-link">{t("link")}</label>
          <input id="invite-link" readOnly className="input font-mono text-xs" value={state.link} onFocus={(e) => e.currentTarget.select()} />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="inv-first">{t("firstName")}</label>
          <input className="input" id="inv-first" name="first_name" required />
        </div>
        <div>
          <label className="label" htmlFor="inv-last">{t("lastName")}</label>
          <input className="input" id="inv-last" name="last_name" required />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="inv-email">{t("email")}</label>
        <input className="input" id="inv-email" name="email" type="email" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="inv-locale">{t("language")}</label>
          <select className="input" id="inv-locale" name="locale" defaultValue="en">
            <option value="de">Deutsch</option>
            <option value="en">English</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="inv-role">{t("role")}</label>
          <select className="input" id="inv-role" name="role" defaultValue="customer">
            <option value="customer">{t("roleCustomer")}</option>
            <option value="staff">{t("roleStaff")}</option>
          </select>
        </div>
      </div>
      <button className="btn-accent" disabled={pending}>{pending ? t("sending") : t("submit")}</button>
    </form>
  );
}
