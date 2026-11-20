import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { requireCustomer } from "@/lib/auth";
import { getGlossaryReviews, getGlossaryTerms, getGlossaryTopics, topicStats } from "@/lib/glossary";
import { pick, type Locale } from "@/lib/types";
import { GlossaryBrowser } from "@/components/glossary/GlossaryBrowser";

export default async function GlossaryPage() {
  const profile = await requireCustomer();
  const t = await getTranslations("glossary");
  const locale = (await getLocale()) as Locale;
  const [topics, terms, reviews] = await Promise.all([getGlossaryTopics(), getGlossaryTerms(), getGlossaryReviews(profile.id)]);
  const stats = topicStats(topics, terms, reviews);
  const termIds = new Set(terms.map((x) => x.id));
  const known = reviews.filter((r) => r.known && termIds.has(r.term_id)).length;
  const learning = reviews.filter((r) => !r.known && termIds.has(r.term_id)).length;
  const status = Object.fromEntries(reviews.map((r) => [r.term_id, r.known ? "known" : "learning"] as const));

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-gradient-to-br from-primary to-accent p-6 text-white">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="mt-2 max-w-2xl text-sm opacity-90">{t("intro", { count: terms.length, topics: topics.length })}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="rounded-md bg-white/10 px-3 py-2 text-sm">{t("knownOf", { known, total: terms.length })}</span>
          <Link href="/app/glossary/train" className="btn bg-white text-primary hover:bg-primary-light">{t("trainMixed")}</Link>
          {learning > 0 && (
            <Link href="/app/glossary/train?filter=learning" className="btn border border-white/60 text-white hover:bg-white/10">
              {t("trainLearning", { count: learning })}
            </Link>
          )}
        </div>
      </section>

      {topics.length === 0 ? (
        <p className="card text-muted">{t("empty")}</p>
      ) : (
        <GlossaryBrowser
          topics={stats.map((s) => ({
            id: s.topic.id,
            icon: s.topic.icon,
            title: pick(s.topic, "title", locale),
            description: pick(s.topic, "description", locale),
            total: s.total,
            known: s.known,
          }))}
          terms={terms}
          status={status}
        />
      )}
    </div>
  );
}
