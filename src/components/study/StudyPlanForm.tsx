"use client";

import { useActionState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { saveStudyPlan } from "@/app/actions/study";
import { FormMessage } from "@/components/FormMessage";
import { PushToggle } from "@/components/pwa/PushToggle";
import { MINUTE_OPTIONS, type StudyPlan } from "@/lib/study";

const noop = () => () => {};
const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Berlin";

export function StudyPlanForm({ plan, isNew, pushKey }: { plan: StudyPlan; isNew: boolean; pushKey: string }) {
  const t = useTranslations("plan");
  const locale = useLocale();
  const [state, action, pending] = useActionState(saveStudyPlan, undefined);
  // Neue Pläne übernehmen die Zeitzone des Geräts, gespeicherte behalten ihre.
  const deviceZone = useSyncExternalStore(noop, browserZone, () => plan.timezone);
  const timezone = isNew ? deviceZone : plan.timezone;
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" });
  // 2024-01-01 war ein Montag.
  const dayNames = [1, 2, 3, 4, 5, 6, 7].map((d) => weekday.format(new Date(Date.UTC(2024, 0, d, 12))));

  return (
    <form action={action} className="card space-y-5">
      <div>
        <h2 className="font-bold text-primary">{isNew ? t("setupTitle") : t("settingsTitle")}</h2>
        {isNew && <p className="mt-1 text-sm text-muted">{t("setupIntro")}</p>}
      </div>
      <FormMessage
        error={state?.error ? t(state.error === "noDays" ? "errorNoDays" : "error") : null}
        success={state?.success ? t("saved") : null}
      />

      <fieldset>
        <legend className="label">{t("dailyGoal")}</legend>
        <div className="flex flex-wrap gap-2">
          {MINUTE_OPTIONS.map((m) => (
            <label key={m} className="cursor-pointer">
              <input type="radio" name="daily_minutes" value={m} defaultChecked={plan.daily_minutes === m} className="peer sr-only" />
              <span className="block rounded-md border border-line px-3 py-1.5 text-sm font-semibold peer-checked:border-primary peer-checked:bg-primary peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
                {t("minutes", { min: m })}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">{t("studyDays")}</legend>
        <div className="flex flex-wrap gap-2">
          {dayNames.map((name, i) => (
            <label key={i} className="cursor-pointer">
              <input type="checkbox" name="days" value={i + 1} defaultChecked={plan.days.includes(i + 1)} className="peer sr-only" />
              <span className="block w-12 rounded-md border border-line py-1.5 text-center text-sm font-semibold peer-checked:border-primary peer-checked:bg-primary peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
                {name}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="label">{t("reminder")}</legend>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="remind" defaultChecked={plan.remind} className="h-4 w-4 accent-[var(--gws-primary)]" />
          {t("remindLabel")}
        </label>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label htmlFor="remind-hour">{t("remindAt")}</label>
          <select id="remind-hour" name="remind_hour" defaultValue={plan.remind_hour} className="input w-28">
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>{`${String(h).padStart(2, "0")}:00`}</option>
            ))}
          </select>
        </div>
        <p className="text-xs text-muted">{t("remindInfo", { tz: timezone })}</p>
        <input type="hidden" name="timezone" value={timezone} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="remind_email" defaultChecked={plan.remind_email ?? true} className="h-4 w-4 accent-[var(--gws-primary)]" />
          {t("remindEmail")}
        </label>
        {pushKey && (
          <div className="rounded-md border border-line p-3">
            <PushToggle publicKey={pushKey} />
          </div>
        )}
      </fieldset>

      <button className="btn-primary" disabled={pending}>{isNew ? t("create") : t("save")}</button>
    </form>
  );
}
