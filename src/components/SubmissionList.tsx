import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { pick, type Lesson, type Locale, type Submission } from "@/lib/types";

export async function SubmissionList({ submissions, title }: { submissions: (Submission & { lesson?: Lesson })[]; title?: string }) {
  const t = await getTranslations("lesson");
  const locale = (await getLocale()) as Locale;
  const format = await getFormatter();
  const supabase = await createClient();
  const paths = submissions.map((s) => s.audio_path).filter((p): p is string => Boolean(p));
  const urls = new Map<string, string>();
  if (paths.length) {
    const { data } = await supabase.storage.from("fsp-recordings").createSignedUrls(paths, 60 * 60);
    data?.forEach((d) => d.path && d.signedUrl && urls.set(d.path, d.signedUrl));
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-primary">{title ?? t("yourSubmissions")}</h2>
      {submissions.map((s) => (
        <article key={s.id} className="card space-y-3">
          {s.lesson && <p className="font-semibold text-primary">{pick(s.lesson, "title", locale)}</p>}
          <p className="text-xs text-muted">{format.dateTime(new Date(s.created_at), { dateStyle: "medium", timeStyle: "short" })}</p>
          {s.text && <p className="whitespace-pre-line text-sm">{s.text}</p>}
          {s.audio_path && urls.get(s.audio_path) && <audio controls src={urls.get(s.audio_path)} className="w-full" />}
          <div className={`rounded-md px-3 py-2 text-sm ${s.feedback ? "bg-success-light" : "bg-primary-light text-muted"}`}>
            <p className="font-semibold text-primary">{t("feedback")}</p>
            <p className="whitespace-pre-line">{s.feedback ?? t("noFeedback")}</p>
          </div>
        </article>
      ))}
    </section>
  );
}
