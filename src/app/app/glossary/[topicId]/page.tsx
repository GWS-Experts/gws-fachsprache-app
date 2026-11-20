import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { requireCustomer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getGlossaryReviews, getGlossaryTerms } from "@/lib/glossary";
import { pick, type GlossaryTopic, type Locale } from "@/lib/types";
import { TermCard } from "@/components/glossary/TermCard";
import { ProgressBar } from "@/components/ProgressBar";

export default async function GlossaryTopicPage({ params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = await params;
  const profile = await requireCustomer();
  const t = await getTranslations("glossary");
  const locale = (await getLocale()) as Locale;
  const supabase = await createClient();
  const { data } = await supabase.from("glossary_topics").select("*").eq("id", topicId).maybeSingle();
  if (!data) notFound();
  const topic = data as GlossaryTopic;
  const [terms, reviews] = await Promise.all([getGlossaryTerms(topicId), getGlossaryReviews(profile.id)]);
  const byTerm = new Map(reviews.map((r) => [r.term_id, r]));
  const known = terms.filter((x) => byTerm.get(x.id)?.known).length;

  return (
    <div className="space-y-6">
      <Link href="/app/glossary" className="text-sm font-semibold text-primary hover:underline">← {t("allTopics")}</Link>
      <header className="space-y-3">
        <h1 className="text-2xl font-bold text-primary">
          <span aria-hidden className="mr-2">{topic.icon}</span>
          {pick(topic, "title", locale)}
        </h1>
        <p className="text-muted">{pick(topic, "description", locale)}</p>
        <div className="max-w-md">
          <p className="mb-1 text-xs font-semibold text-muted">{t("knownOf", { known, total: terms.length })}</p>
          <ProgressBar value={terms.length ? Math.round((known / terms.length) * 100) : 0} />
        </div>
        {terms.length > 0 && (
          <Link href={`/app/glossary/train?topic=${topic.id}`} className="btn-primary">{t("trainTopic")}</Link>
        )}
      </header>
      <ul className="grid gap-3 md:grid-cols-2">
        {terms.map((term) => {
          const r = byTerm.get(term.id);
          return (
            <li key={term.id}>
              <TermCard term={term} status={r ? (r.known ? "known" : "learning") : undefined} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
