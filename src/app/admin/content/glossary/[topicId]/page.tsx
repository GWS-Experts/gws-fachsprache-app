import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getGlossaryTerms } from "@/lib/glossary";
import type { GlossaryTopic } from "@/lib/types";
import { deleteGlossaryTopic } from "@/app/actions/glossary";
import { ConfirmButton } from "@/components/ConfirmButton";
import { GlossaryImportForm, GlossaryTermForm, GlossaryTopicForm } from "@/components/glossary/GlossaryAdminForms";
import { GlossaryTermRow } from "@/components/glossary/GlossaryTermRow";

export default async function GlossaryTopicAdminPage({ params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = await params;
  await requireStaff();
  const t = await getTranslations("glossaryAdmin");
  const supabase = await createClient();
  const { data } = await supabase.from("glossary_topics").select("*").eq("id", topicId).maybeSingle();
  if (!data) notFound();
  const topic = data as GlossaryTopic;
  const terms = await getGlossaryTerms(topicId);

  return (
    <div className="space-y-6">
      <Link href="/admin/content/glossary" className="text-sm font-semibold text-primary hover:underline">← {t("allTopics")}</Link>
      <GlossaryTopicForm topic={topic} />
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-primary">{t("terms")} ({terms.length})</h2>
        {terms.length === 0 && <p className="card text-sm text-muted">{t("noTerms")}</p>}
        <ul className="space-y-2">
          {terms.map((term) => <GlossaryTermRow key={term.id} term={term} />)}
        </ul>
      </section>
      <section className="card space-y-3">
        <h2 className="font-bold text-primary">{t("newTerm")}</h2>
        <GlossaryTermForm topicId={topic.id} />
      </section>
      <GlossaryImportForm topicId={topic.id} />
      <form action={deleteGlossaryTopic} className="text-right">
        <input type="hidden" name="id" value={topic.id} />
        <ConfirmButton message={t("confirmDeleteTopic")} className="btn-danger">{t("deleteTopic")}</ConfirmButton>
      </form>
    </div>
  );
}
