import { getTranslations } from "next-intl/server";
import { requireCustomer } from "@/lib/auth";
import { getLearningStats } from "@/lib/data";
import { ProgressDashboard } from "@/components/ProgressDashboard";
import { SubmissionList } from "@/components/SubmissionList";

export default async function ProgressPage() {
  const profile = await requireCustomer();
  const t = await getTranslations("progress");
  const stats = await getLearningStats(profile.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">{t("title")}</h1>
      <ProgressDashboard stats={stats} lessonHref={(id) => `/app/lesson/${id}`} />
      {stats.submissions.length > 0 && <SubmissionList submissions={stats.submissions} title={t("submissions")} />}
    </div>
  );
}
