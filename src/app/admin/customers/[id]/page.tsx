import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getLearningStats } from "@/lib/data";
import type { Profile } from "@/lib/types";
import { ProgressDashboard } from "@/components/ProgressDashboard";
import { MessageThread } from "@/components/MessageThread";
import { FeedbackList } from "@/components/FeedbackList";
import { CustomerDataForm } from "@/components/CustomerDataForm";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await requireStaff();
  const t = await getTranslations("customer");
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const customer = data as Profile;
  const stats = await getLearningStats(customer.id);

  return (
    <div className="space-y-8">
      <Link href="/admin" className="text-sm font-semibold text-primary hover:underline">← {t("back")}</Link>
      <header>
        <h1 className="text-2xl font-bold text-primary">{`${customer.first_name} ${customer.last_name}`.trim() || customer.email}</h1>
        <p className="text-sm text-muted">{customer.email}</p>
      </header>
      <CustomerDataForm customer={customer} />
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-primary">{t("dashboard")}</h2>
        <ProgressDashboard stats={stats} lessonHref={(lessonId) => `/admin/content/lesson/${lessonId}`} />
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-primary">{t("submissions")}</h2>
        <FeedbackList submissions={stats.submissions} />
      </section>
      <section id="messages" className="space-y-3">
        <h2 className="text-xl font-bold text-primary">{t("messages")}</h2>
        <MessageThread customerId={customer.id} viewer={staff} />
      </section>
    </div>
  );
}
