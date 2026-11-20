import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireStaff } from "@/lib/auth";
import { getGlossaryTerms, getGlossaryTopics } from "@/lib/glossary";
import { GlossaryTopicForm } from "@/components/glossary/GlossaryAdminForms";

export default async function GlossaryAdminPage() {
  await requireStaff();
  const t = await getTranslations("glossaryAdmin");
  const [topics, terms] = await Promise.all([getGlossaryTopics(), getGlossaryTerms()]);
  const counts = new Map<string, number>();
  for (const term of terms) counts.set(term.topic_id, (counts.get(term.topic_id) ?? 0) + 1);

  return (
    <div className="space-y-6">
      <Link href="/admin/content" className="text-sm font-semibold text-primary hover:underline">← {t("backToContent")}</Link>
      <header>
        <h1 className="text-2xl font-bold text-primary">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("intro", { count: terms.length, topics: topics.length })}</p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((tp) => (
          <li key={tp.id}>
            <Link href={`/admin/content/glossary/${tp.id}`} className="card flex h-full flex-col hover:border-primary">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-bold text-primary"><span aria-hidden className="mr-1.5">{tp.icon}</span>{tp.title_de}</h2>
                <span className={`badge ${tp.published ? "bg-success-light text-success" : "bg-page text-muted"}`}>{tp.published ? t("published") : t("draft")}</span>
              </div>
              <p className="mt-1 flex-1 text-sm text-muted">{tp.description_de}</p>
              <p className="mt-3 text-xs font-semibold text-muted">{t("termCount", { count: counts.get(tp.id) ?? 0 })}</p>
            </Link>
          </li>
        ))}
      </ul>
      <GlossaryTopicForm />
    </div>
  );
}
