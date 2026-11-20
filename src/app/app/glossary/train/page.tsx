import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireCustomer } from "@/lib/auth";
import { getGlossaryReviews, getGlossaryTerms, getGlossaryTopics } from "@/lib/glossary";
import { pick, type GlossaryTerm, type Locale } from "@/lib/types";
import { GlossaryTrainer } from "@/components/glossary/GlossaryTrainer";

const SESSION_SIZE = 20;

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Reihenfolge: zuerst nicht gewusste, dann neue, dann gewusste (am längsten nicht geübt zuerst).
export default async function GlossaryTrainPage({ searchParams }: { searchParams: Promise<{ topic?: string; filter?: string }> }) {
  const sp = await searchParams;
  const profile = await requireCustomer();
  const t = await getTranslations("glossary");
  const locale = (await getLocale()) as Locale;
  const topicId = z.string().uuid().safeParse(sp.topic).success ? sp.topic : undefined;
  const onlyLearning = sp.filter === "learning";

  const [topics, terms, reviews] = await Promise.all([getGlossaryTopics(), getGlossaryTerms(topicId), getGlossaryReviews(profile.id)]);
  const topic = topicId ? topics.find((x) => x.id === topicId) : undefined;
  const byTerm = new Map(reviews.map((r) => [r.term_id, r]));

  const learning = shuffle(terms.filter((x) => byTerm.get(x.id)?.known === false));
  const fresh = shuffle(terms.filter((x) => !byTerm.has(x.id)));
  const known = terms
    .filter((x) => byTerm.get(x.id)?.known)
    .sort((a, b) => byTerm.get(a.id)!.updated_at.localeCompare(byTerm.get(b.id)!.updated_at));
  const cards: GlossaryTerm[] = (onlyLearning ? learning : [...learning, ...fresh, ...known]).slice(0, SESSION_SIZE);
  const backHref = topic ? `/app/glossary/${topic.id}` : "/app/glossary";

  return (
    <div className="space-y-6">
      <Link href={backHref} className="text-sm font-semibold text-primary hover:underline">← {t("back")}</Link>
      <header>
        <h1 className="text-2xl font-bold text-primary">{t("trainTitle")}</h1>
        <p className="mt-1 text-muted">
          {topic ? `${topic.icon} ${pick(topic, "title", locale)}` : onlyLearning ? t("trainLearningIntro") : t("trainMixedIntro")}
        </p>
      </header>
      <GlossaryTrainer key={cards.map((c) => c.id).join()} cards={shuffle(cards)} backHref={backHref} />
    </div>
  );
}
