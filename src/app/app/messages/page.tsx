import { getTranslations } from "next-intl/server";
import { requireCustomer } from "@/lib/auth";
import { MessageThread } from "@/components/MessageThread";

export default async function CustomerMessagesPage({ searchParams }: { searchParams: Promise<{ lesson?: string }> }) {
  const profile = await requireCustomer();
  const t = await getTranslations("messages");
  const { lesson } = await searchParams;
  const lessonId = lesson && /^[0-9a-f-]{36}$/.test(lesson) ? lesson : undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-primary">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("intro")}</p>
      </header>
      <MessageThread customerId={profile.id} viewer={profile} lessonId={lessonId} />
    </div>
  );
}
