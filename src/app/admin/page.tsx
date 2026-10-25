import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getLessons, getModules } from "@/lib/data";
import type { Message, Profile, Progress } from "@/lib/types";
import { ProgressBar } from "@/components/ProgressBar";
import { InviteForm } from "@/components/InviteForm";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireStaff();
  const t = await getTranslations("customers");
  const format = await getFormatter();
  const { q = "" } = await searchParams;
  const supabase = await createClient();

  const [{ data: profiles }, { data: progress }, { data: messages }, modules, lessons] = await Promise.all([
    supabase.from("profiles").select("*").order("last_name").order("first_name"),
    supabase.from("progress").select("user_id, lesson_id, completed_at"),
    supabase.from("messages").select("customer_id, sender_id, read_at"),
    getModules(),
    getLessons(),
  ]);

  const publishedModules = new Set(modules.filter((m) => m.published).map((m) => m.id));
  const visibleLessons = new Set(lessons.filter((l) => l.published && publishedModules.has(l.module_id)).map((l) => l.id));
  const all = (profiles ?? []) as Profile[];
  const customers = all.filter((p) => p.role === "customer");
  const staff = all.filter((p) => p.role === "staff");
  const needle = q.trim().toLowerCase();
  const filtered = needle ? customers.filter((c) => `${c.first_name} ${c.last_name} ${c.email}`.toLowerCase().includes(needle)) : customers;

  const statsFor = (id: string) => {
    const rows = ((progress ?? []) as Progress[]).filter((p) => p.user_id === id);
    const done = new Set(rows.filter((r) => visibleLessons.has(r.lesson_id)).map((r) => r.lesson_id)).size;
    const last = rows.reduce<string | null>((acc, r) => (!acc || r.completed_at > acc ? r.completed_at : acc), null);
    const open = ((messages ?? []) as Message[]).filter((m) => m.customer_id === id && m.sender_id === id && !m.read_at).length;
    return { percent: visibleLessons.size ? Math.round((done / visibleLessons.size) * 100) : 0, last, open };
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("count", { count: customers.length })}</p>
        </div>
        <form className="flex gap-2" role="search">
          <label htmlFor="q" className="sr-only">{t("search")}</label>
          <input id="q" name="q" defaultValue={q} className="input w-56" placeholder={t("search")} />
          <button className="btn-outline">{t("searchButton")}</button>
        </form>
      </header>

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-primary-light text-xs uppercase text-primary">
            <tr>
              <th className="px-4 py-3">{t("firstName")}</th>
              <th className="px-4 py-3">{t("lastName")}</th>
              <th className="px-4 py-3">{t("email")}</th>
              <th className="w-48 px-4 py-3">{t("progress")}</th>
              <th className="px-4 py-3">{t("lastActivity")}</th>
              <th className="px-4 py-3">{t("messages")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-muted">{t("empty")}</td></tr>
            )}
            {filtered.map((c) => {
              const s = statsFor(c.id);
              return (
                <tr key={c.id} className="border-t border-line hover:bg-page">
                  <td className="px-4 py-3 font-semibold"><Link className="text-primary hover:underline" href={`/admin/customers/${c.id}`}>{c.first_name || "–"}</Link></td>
                  <td className="px-4 py-3 font-semibold"><Link className="text-primary hover:underline" href={`/admin/customers/${c.id}`}>{c.last_name || "–"}</Link></td>
                  <td className="px-4 py-3">{c.email}</td>
                  <td className="px-4 py-3"><ProgressBar value={s.percent} /></td>
                  <td className="px-4 py-3 text-muted">{s.last ? format.dateTime(new Date(s.last), { dateStyle: "medium" }) : "–"}</td>
                  <td className="px-4 py-3">{s.open > 0 ? <span className="badge bg-accent text-white">{t("open", { count: s.open })}</span> : <span className="text-muted">–</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <InviteForm />
        <section className="card space-y-2">
          <h2 className="font-bold text-primary">{t("staffTitle")}</h2>
          <ul className="divide-y divide-line text-sm">
            {staff.map((s) => (
              <li key={s.id} className="flex justify-between gap-3 py-2">
                <span className="font-semibold">{`${s.first_name} ${s.last_name}`.trim() || "–"}</span>
                <span className="text-muted">{s.email}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
