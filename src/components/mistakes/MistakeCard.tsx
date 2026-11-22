import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getMistakeOverview } from "@/lib/mistakes-data";

// Hinweis auf offene Fehler (Startseite, Fortschritt). Ohne offene Fehler wird nichts angezeigt.
export async function MistakeCard({ userId }: { userId: string }) {
  const t = await getTranslations("mistakes");
  const { open } = await getMistakeOverview(userId, { sync: true });
  if (open.length === 0) return null;
  return (
    <Link href="/app/mistakes" className="card flex items-center justify-between gap-3 border-accent transition hover:border-primary hover:shadow-md">
      <span className="flex items-center gap-3">
        <span className="text-3xl" aria-hidden>🎯</span>
        <span>
          <span className="block font-bold text-primary">{t("homeTitle", { count: open.length })}</span>
          <span className="block text-sm text-muted">{t("homeText")}</span>
        </span>
      </span>
      <span className="btn-primary shrink-0">{t("practise")}</span>
    </Link>
  );
}
