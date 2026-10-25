"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { requestPasswordReset } from "@/app/actions/auth";
import { AuthShell } from "@/components/AuthShell";
import { FormMessage } from "@/components/FormMessage";

export default function ForgotPasswordPage() {
  const t = useTranslations("forgot");
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);

  return (
    <AuthShell title={t("title")} intro={t("intro")}>
      <form action={action} className="space-y-4">
        <FormMessage error={state?.error ? t("invalid") : null} success={state?.success ? t("sent") : null} />
        <div>
          <label className="label" htmlFor="email">{t("email")}</label>
          <input className="input" id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <button className="btn-primary w-full" disabled={pending}>{t("submit")}</button>
        <p className="text-center text-sm">
          <Link className="text-primary underline" href="/login">{t("back")}</Link>
        </p>
      </form>
    </AuthShell>
  );
}
