import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { createAdminClient, hasAdminKey } from "@/lib/supabase/admin";
import { mailConfigured, sendMail } from "@/lib/mail";
import { siteUrl } from "@/lib/env";
import { localParts, type StudyPlan } from "@/lib/study";

export const dynamic = "force-dynamic";

// Tägliche Lern-Erinnerung per E-Mail. Wird vom Server regelmäßig aufgerufen (z. B. alle 15 Minuten per crontab):
//   curl -fsS -H "Authorization: Bearer $CRON_SECRET" http://127.0.0.1:3010/api/cron/study-reminders
// Erinnert wird an Lerntagen ab der gewählten Uhrzeit (bis 3 Stunden danach), höchstens einmal pro Tag,
// und nur, wenn das Tagesziel noch nicht erreicht ist.
const WINDOW_HOURS = 3;

type PlanWithProfile = StudyPlan & { profile: { email: string; first_name: string; locale: string; role: string } | null };

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!hasAdminKey() || !mailConfigured()) {
    return NextResponse.json({ error: "not configured", mail: mailConfigured(), adminKey: hasAdminKey() }, { status: 503 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("study_plans")
    .select("*, profile:profiles(email, first_name, locale, role)")
    .eq("remind", true);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let due = 0;
  let sent = 0;
  for (const plan of (data as PlanWithProfile[]) ?? []) {
    if (!plan.profile || plan.profile.role !== "customer") continue;
    const now = localParts(plan.timezone);
    const sinceHour = now.hour - plan.remind_hour;
    if (!plan.days.includes(now.weekday) || sinceHour < 0 || sinceHour >= WINDOW_HOURS) continue;
    if (plan.last_reminded_on === now.date) continue;
    due++;

    const { data: activity } = await supabase
      .from("study_activity")
      .select("seconds")
      .eq("user_id", plan.user_id)
      .eq("day", now.date)
      .maybeSingle();
    const done = Math.round((activity?.seconds ?? 0) / 60);
    let mailed = false;
    if (done < plan.daily_minutes) {
      const locale = plan.profile.locale === "en" ? "en" : "de";
      const t = await getTranslations({ locale, namespace: "mail" });
      mailed = await sendMail({
        to: plan.profile.email,
        subject: done > 0 ? t("reminderSubjectAlmost") : t("reminderSubject", { min: plan.daily_minutes }),
        text: t("reminderBody", {
          name: plan.profile.first_name || plan.profile.email,
          min: plan.daily_minutes,
          left: plan.daily_minutes - done,
          done,
          link: `${siteUrl()}/app/plan`,
        }),
      });
      if (mailed) sent++;
    }
    // Als erledigt merken, wenn verschickt oder das Ziel schon erreicht ist; bei Fehlern beim nächsten Lauf erneut versuchen.
    if (mailed || done >= plan.daily_minutes) {
      await supabase.from("study_plans").update({ last_reminded_on: now.date }).eq("user_id", plan.user_id);
    }
  }

  return NextResponse.json({ plans: data?.length ?? 0, due, sent });
}
