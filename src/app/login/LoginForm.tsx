"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { signIn } from "@/app/actions/auth";
import { FormMessage } from "@/components/FormMessage";

export function LoginForm({ initialError }: { initialError?: string }) {
  const t = useTranslations("login");
  const [state, action, pending] = useActionState(signIn, undefined);
  const errorKey = state?.error ?? initialError;
  const error = errorKey ? t(`errors.${errorKey}` as "errors.invalid") : null;

  return (
    <form action={action} className="space-y-4">
      <FormMessage error={error} />
      <div>
        <label className="label" htmlFor="email">{t("email")}</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <label className="label" htmlFor="password">{t("password")}</label>
        <input className="input" id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <button className="btn-primary w-full" disabled={pending}>{pending ? t("submitting") : t("submit")}</button>
      <p className="text-center text-sm">
        <Link className="text-primary underline" href="/forgot-password">{t("forgot")}</Link>
      </p>
    </form>
  );
}
