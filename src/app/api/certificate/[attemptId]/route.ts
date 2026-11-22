import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAttempt, getExam, getExamParts } from "@/lib/exam-data";
import { summarize } from "@/lib/exam";
import { certificateNumber, renderCertificate } from "@/lib/certificate";
import type { Profile } from "@/lib/types";

export const runtime = "nodejs";

// Übungszertifikat als PDF – nur für bestandene, vollständig bewertete Probeprüfungen.
// Kunden bekommen nur ihr eigenes Zertifikat (RLS), GWS alle.
export async function GET(_req: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const viewer = await getCurrentProfile();
  if (!viewer) return new NextResponse("Nicht angemeldet", { status: 401 });
  const { attemptId } = await params;
  if (!z.string().uuid().safeParse(attemptId).success) return new NextResponse("Nicht gefunden", { status: 404 });

  const attempt = await getAttempt(attemptId);
  if (!attempt || (viewer.role !== "staff" && attempt.user_id !== viewer.id)) return new NextResponse("Nicht gefunden", { status: 404 });
  const exam = await getExam(attempt.exam_id);
  if (!exam || !attempt.finished_at) return new NextResponse("Nicht gefunden", { status: 404 });
  const parts = await getExamParts(exam);
  const summary = summarize(attempt, parts, exam.pass_percent);
  if (summary.passed !== true) return new NextResponse("Für diese Prüfung gibt es (noch) kein Zertifikat.", { status: 403 });

  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("first_name, last_name, email").eq("id", attempt.user_id).maybeSingle();
  const person = data as Pick<Profile, "first_name" | "last_name" | "email"> | null;
  const name = person ? `${person.first_name} ${person.last_name}`.trim() || person.email : "";
  if (!name) return new NextResponse("Nicht gefunden", { status: 404 });

  const issued = new Date(attempt.reviewed_at ?? attempt.finished_at);
  const number = certificateNumber(attempt.id, new Date(attempt.finished_at));
  const bytes = await renderCertificate({
    number,
    name,
    examTitle: exam.title_de,
    examDate: new Date(attempt.started_at),
    issuedDate: issued,
    passPercent: exam.pass_percent,
    summary,
  });

  const file = `Zertifikat-${name.normalize("NFD").replace(/[^\w-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "GWS"}.pdf`;
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${file}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
