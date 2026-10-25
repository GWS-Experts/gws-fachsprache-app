"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { setPassword } from "@/app/actions/auth";
import { AuthShell } from "@/components/AuthShell";
import { FormMessage } from "@/components/FormMessage";

export default function SetPasswordPage() {
  const t = useTranslations("setPassword");
  const [state, action, pending] = useActionState(setPassword, undefined);

  return (
    <AuthShell title={t("title")} intro={t("intro")}>
      <form action={action} className="space-y-4">
        <FormMessage error={state?.error ? t(`errors.${state.error}` as "errors.generic") : null} />
        <div>
          <label className="label" htmlFor="password">{t("password")}</label>
          <input className="input" id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        </div>
        <div>
          <label className="label" htmlFor="confirm">{t("confirm")}</label>
          <input className="input" id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
        </div>
        <button className="btn-primary w-full" disabled={pending}>{t("submit")}</button>
      </form>
    </AuthShell>
  );
}
