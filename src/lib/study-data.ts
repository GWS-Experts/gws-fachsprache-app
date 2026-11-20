import "server-only";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_PLAN, addDays, computeStreak, localParts, type StudyActivity, type StudyPlan } from "@/lib/study";

export interface StudyOverview {
  plan: StudyPlan;
  hasPlan: boolean;
  today: string;
  todayWeekday: number;
  todaySeconds: number;
  goalSeconds: number;
  plannedToday: boolean;
  streak: number;
  days: (StudyActivity & { planned: boolean })[]; // letzte 14 Tage, ältester zuerst
}

// Lernplan und Lernzeit eines Kunden. Fehlen die Tabellen noch (Migration nicht eingespielt),
// gibt es einen Standardplan ohne Verlauf.
export async function getStudyOverview(userId: string): Promise<StudyOverview> {
  const supabase = await createClient();
  const { data: planRow } = await supabase.from("study_plans").select("*").eq("user_id", userId).maybeSingle();
  const plan: StudyPlan = (planRow as StudyPlan | null) ?? { user_id: userId, ...DEFAULT_PLAN };
  const now = localParts(plan.timezone);
  const from = addDays(now.date, -400);
  const { data: rows } = await supabase
    .from("study_activity")
    .select("day, seconds, lessons, cards")
    .eq("user_id", userId)
    .gte("day", from)
    .order("day");
  const byDay = new Map(((rows as StudyActivity[]) ?? []).map((r) => [r.day, r]));
  const days = Array.from({ length: 14 }, (_, i) => {
    const day = addDays(now.date, i - 13);
    const a = byDay.get(day);
    const weekday = ((now.weekday - 1 + i - 13) % 7 + 7) % 7 + 1;
    return { day, seconds: a?.seconds ?? 0, lessons: a?.lessons ?? 0, cards: a?.cards ?? 0, planned: plan.days.includes(weekday) };
  });
  return {
    plan,
    hasPlan: Boolean(planRow),
    today: now.date,
    todayWeekday: now.weekday,
    todaySeconds: byDay.get(now.date)?.seconds ?? 0,
    goalSeconds: plan.daily_minutes * 60,
    plannedToday: plan.days.includes(now.weekday),
    streak: computeStreak(plan, byDay, now.date),
    days,
  };
}
