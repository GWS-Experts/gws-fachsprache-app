"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { changePassword, updateProfile } from "@/app/actions/profile";
import { FormMessage } from "@/components/FormMessage";
import type { Profile } from "@/lib/types";

export function ProfileForms({ profile }: { profile: Profile }) {
  const t = useTranslations("profile");
  const [state, action, pending] = useActionState(updateProfile, undefined);
  const [pwState, pwAction, pwPending] = useActionState(changePassword, undefined);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form action={action} className="card space-y-4">
        <h2 className="font-bold text-primary">{t("data")}</h2>
        <FormMessage error={state?.error ? t(`errors.${state.error}` as "errors.generic") : null} success={state?.success ? t(state.success as "saved") : null} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="first_name">{t("firstName")}</label>
            <input className="input" id="first_name" name="first_name" defaultValue={profile.first_name} required autoComplete="given-name" />
          </div>
          <div>
            <label className="label" htmlFor="last_name">{t("lastName")}</label>
            <input className="input" id="last_name" name="last_name" defaultValue={profile.last_name} required autoComplete="family-name" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="email">{t("email")}</label>
          <input className="input" id="email" name="email" type="email" defaultValue={profile.email} required autoComplete="email" />
          <p className="mt-1 text-xs text-muted">{t("emailHint")}</p>
        </div>
        <div>
          <label className="label" htmlFor="locale">{t("language")}</label>
          <select className="input" id="locale" name="locale" defaultValue={profile.locale}>
            <option value="de">Deutsch</option>
            <option value="en">English</option>
          </select>
        </div>
        <button className="btn-primary" disabled={pending}>{t("save")}</button>
      </form>

      <form action={pwAction} className="card space-y-4">
        <h2 className="font-bold text-primary">{t("changePassword")}</h2>
        <FormMessage error={pwState?.error ? t(`errors.${pwState.error}` as "errors.generic") : null} success={pwState?.success ? t("passwordSaved") : null} />
        <div>
          <label className="label" htmlFor="password">{t("newPassword")}</label>
          <input className="input" id="password" name="password" type="password" minLength={8} required autoComplete="new-password" />
        </div>
        <div>
          <label className="label" htmlFor="confirm">{t("confirmPassword")}</label>
          <input className="input" id="confirm" name="confirm" type="password" minLength={8} required autoComplete="new-password" />
        </div>
        <button className="btn-outline" disabled={pwPending}>{t("savePassword")}</button>
      </form>
    </div>
  );
}
