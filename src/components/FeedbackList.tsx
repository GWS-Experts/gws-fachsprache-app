import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { pick, type Lesson, type Locale, type Submission } from "@/lib/types";
import { FeedbackForm } from "@/components/FeedbackForm";
import { KindBadge } from "@/components/KindBadge";

type Row = Submission & { lesson?: Lesson; customerName?: string };

export async function FeedbackList({ submissions }: { submissions: Row[] }) {
  const t = await getTranslations("feedback");
  const format = await getFormatter();
  const locale = (await getLocale()) as Locale;
  const supabase = await createClient();

  const paths = submissions.map((s) => s.audio_path).filter((p): p is string => Boolean(p));
  const urls = new Map<string, string>();
  if (paths.length) {
    const { data } = await supabase.storage.from("fsp-recordings").createSignedUrls(paths, 60 * 60);
    data?.forEach((d) => d.path && d.signedUrl && urls.set(d.path, d.signedUrl));
  }

  if (submissions.length === 0) return <p className="card text-sm text-muted">{t("empty")}</p>;

  return (
    <ul className="space-y-4">
      {submissions.map((s) => (
        <li key={s.id} className="card space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {s.lesson && <KindBadge kind={s.lesson.kind} />}
              <span className="font-semibold">{s.lesson ? pick(s.lesson, "title", locale) : "–"}</span>
              {s.customerName && <span className="text-sm text-muted">· {s.customerName}</span>}
            </div>
            <span className="text-xs text-muted">{format.dateTime(new Date(s.created_at), { dateStyle: "medium", timeStyle: "short" })}</span>
          </div>
          {s.lesson?.content.task_de && <p className="rounded-md bg-page px-3 py-2 text-xs text-muted">{s.lesson.content.task_de}</p>}
          {s.text && <p className="whitespace-pre-line text-sm">{s.text}</p>}
          {s.audio_path && urls.get(s.audio_path) && <audio controls src={urls.get(s.audio_path)} className="w-full" />}
          <FeedbackForm id={s.id} initial={s.feedback ?? ""} />
        </li>
      ))}
    </ul>
  );
}
