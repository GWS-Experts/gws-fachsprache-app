import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAttempt, getExam, getExamParts } from "@/lib/exam-data";
import { deleteAttempt } from "@/app/actions/exam";
import { ExamResult } from "@/components/exam/ExamResult";
import { ConfirmButton } from "@/components/ConfirmButton";

export default async function AdminAttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireStaff();
  const t = await getTranslations("examAdmin");
  const attempt = await getAttempt(id);
  if (!attempt) notFound();
  const exam = await getExam(attempt.exam_id);
  if (!exam) notFound();
  const parts = await getExamParts(exam);
  const supabase = await createClient();
  const { data: customer } = await supabase.from("profiles").select("first_name, last_name, email").eq("id", attempt.user_id).maybeSingle();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/admin/exams" className="text-sm font-semibold text-primary hover:underline">← {t("allAttempts")}</Link>
      <p className="text-sm">
        {t("customer")}:{" "}
        <Link href={`/admin/customers/${attempt.user_id}`} className="font-semibold text-primary underline">
          {customer ? `${customer.first_name} ${customer.last_name}`.trim() || customer.email : "–"}
        </Link>
      </p>
      <ExamResult exam={exam} attempt={attempt} parts={parts} locale="de" staff />
      <form action={deleteAttempt} className="text-right">
        <input type="hidden" name="attempt_id" value={attempt.id} />
        <ConfirmButton message={t("confirmDeleteAttempt")} className="btn-danger">{t("deleteAttempt")}</ConfirmButton>
      </form>
    </div>
  );
}
