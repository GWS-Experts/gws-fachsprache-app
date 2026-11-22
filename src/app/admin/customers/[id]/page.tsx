import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getLearningStats, getLessons, getModules } from "@/lib/data";
import { computeReadiness } from "@/lib/readiness";
import { ReadinessCard } from "@/components/Readiness";
import type { Profile } from "@/lib/types";
import { ProgressDashboard } from "@/components/ProgressDashboard";
import { MessageThread } from "@/components/MessageThread";
import { FeedbackList } from "@/components/FeedbackList";
import { CustomerDataForm } from "@/components/CustomerDataForm";
import { DeleteCustomerForm } from "@/components/privacy/DeleteCustomerForm";
import { StaffMistakes } from "@/components/mistakes/StaffMistakes";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await requireStaff();
  const t = await getTranslations("customer");
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const customer = data as Profile;
  const [stats, modules, lessons, { data: progress }] = await Promise.all([
    getLearningStats(customer.id),
    getModules(),
    getLessons(),
    supabase.from("progress").select("user_id, lesson_id, score, max_score, completed_at").eq("user_id", customer.id),
  ]);
  const published = new Set(modules.filter((m) => m.published).map((m) => m.id));
  const readiness = computeReadiness(
    lessons.filter((l) => l.published && published.has(l.module_id)),
    progress ?? [],
    stats.submissions,
  );

  return (
    <div className="space-y-8">
      <Link href="/admin" className="text-sm font-semibold text-primary hover:underline">← {t("back")}</Link>
      <header>
        <h1 className="text-2xl font-bold text-primary">{`${customer.first_name} ${customer.last_name}`.trim() || customer.email}</h1>
        <p className="text-sm text-muted">{customer.email}</p>
      </header>
      {customer.role === "customer" && <ReadinessCard r={readiness} />}
      <CustomerDataForm customer={customer} />
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-primary">{t("dashboard")}</h2>
        <ProgressDashboard stats={stats} lessonHref={(lessonId) => `/admin/content/lesson/${lessonId}`} />
      </section>
      {customer.role === "customer" && <StaffMistakes customerId={customer.id} />}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-primary">{t("submissions")}</h2>
        <FeedbackList submissions={stats.submissions} />
      </section>
      <section id="messages" className="space-y-3">
        <h2 className="text-xl font-bold text-primary">{t("messages")}</h2>
        <MessageThread customerId={customer.id} viewer={staff} />
      </section>
      {customer.role === "customer" && <DeleteCustomerForm customerId={customer.id} email={customer.email} />}
    </div>
  );
}
