import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireStaff } from "@/lib/auth";
import { getLessons, getModules } from "@/lib/data";
import { ModuleForm } from "@/components/ModuleForm";

export default async function ContentPage() {
  await requireStaff();
  const t = await getTranslations("content");
  const [modules, lessons] = await Promise.all([getModules(), getLessons()]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-primary">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("intro")}</p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m) => (
          <li key={m.id}>
            <Link href={`/admin/content/${m.id}`} className="card flex h-full flex-col hover:border-primary">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-bold text-primary">{m.title_de}</h2>
                <span className={`badge ${m.published ? "bg-success-light text-success" : "bg-page text-muted"}`}>{m.published ? t("published") : t("draft")}</span>
              </div>
              <p className="mt-1 flex-1 text-sm text-muted">{m.description_de}</p>
              <p className="mt-3 text-xs font-semibold text-muted">{t("lessonCount", { count: lessons.filter((l) => l.module_id === m.id).length })}</p>
            </Link>
          </li>
        ))}
      </ul>
      <ModuleForm />
    </div>
  );
}
