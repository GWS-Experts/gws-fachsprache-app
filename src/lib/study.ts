// Lernplan: Hilfsfunktionen für Datum, Zeitzone und Serie (Server und Browser).

export interface StudyPlan {
  user_id: string;
  daily_minutes: number;
  days: number[]; // ISO-Wochentage 1 = Montag … 7 = Sonntag
  remind: boolean;
  remind_hour: number;
  timezone: string;
  last_reminded_on: string | null;
}

export interface StudyActivity {
  day: string; // YYYY-MM-DD
  seconds: number;
  lessons: number;
  cards: number;
}

export const DEFAULT_PLAN: Omit<StudyPlan, "user_id"> = {
  daily_minutes: 10,
  days: [1, 2, 3, 4, 5, 6, 7],
  remind: true,
  remind_hour: 18,
  timezone: "Europe/Berlin",
  last_reminded_on: null,
};

export const MINUTE_OPTIONS = [5, 10, 15, 20, 30, 45, 60];

export function validTimeZone(tz: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

const WEEKDAYS: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

// Datum, Wochentag und Stunde in der Zeitzone des Kunden.
export function localParts(timeZone: string, at = new Date()) {
  const tz = validTimeZone(timeZone) ? timeZone : "Europe/Berlin";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short", hour: "2-digit", hourCycle: "h23" })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, weekday: WEEKDAYS[parts.weekday] ?? 1, hour: Number(parts.hour) % 24 };
}

export function addDays(date: string, n: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function isoWeekday(date: string) {
  const w = new Date(`${date}T12:00:00Z`).getUTCDay();
  return w === 0 ? 7 : w;
}

// Serie: Lerntage in Folge, an denen das Tagesziel erreicht wurde. Freie Tage unterbrechen nicht;
// heute zählt erst, wenn das Ziel erreicht ist, bricht die Serie aber auch noch nicht.
export function computeStreak(plan: Pick<StudyPlan, "daily_minutes" | "days">, byDay: Map<string, StudyActivity>, today: string) {
  const goal = plan.daily_minutes * 60;
  const reached = (d: string) => (byDay.get(d)?.seconds ?? 0) >= goal;
  let streak = reached(today) ? 1 : 0;
  let day = addDays(today, -1);
  for (let i = 0; i < 366; i++, day = addDays(day, -1)) {
    if (reached(day)) streak++;
    else if (plan.days.includes(isoWeekday(day))) break;
  }
  return streak;
}
