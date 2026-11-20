import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getLessons, getModules } from "@/lib/data";
import type { Message, Profile } from "@/lib/types";
import { computeReadiness, type ReadinessStatus } from "@/lib/readiness";
import { ProgressBar } from "@/components/ProgressBar";
import { InviteForm } from "@/components/InviteForm";
import { PartChips, ReadinessBadge } from "@/components/Readiness";

const STATUSES: ReadinessStatus[] = ["ready", "onTrack", "behind", "inactive"];
const SORTS = ["readiness", "name", "activity"] as const;
type Sort = (typeof SORTS)[number];

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; sort?: string }> }) {
  await requireStaff();
  const t = await getTranslations("customers");
  const tr = await getTranslations("readiness");
  const format = await getFormatter();
  const { q = "", status: statusParam, sort: sortParam } = await searchParams;
  const status = STATUSES.includes(statusParam as ReadinessStatus) ? (statusParam as ReadinessStatus) : null;
  const sort: Sort = SORTS.includes(sortParam as Sort) ? (sortParam as Sort) : "readiness";
  const supabase = await createClient();

  const [{ data: profiles }, { data: progress }, { data: submissions }, { data: messages }, modules, lessons] = await Promise.all([
    supabase.from("profiles").select("*").order("last_name").order("first_name"),
    supabase.from("progress").select("user_id, lesson_id, score, max_score, completed_at"),
    supabase.from("submissions").select("user_id, lesson_id, feedback, created_at"),
    supabase.from("messages").select("customer_id, sender_id, read_at"),
    getModules(),
    getLessons(),
  ]);

  const publishedModules = new Set(modules.filter((m) => m.published).map((m) => m.id));
  const visibleLessons = lessons.filter((l) => l.published && publishedModules.has(l.module_id));
  const all = (profiles ?? []) as Profile[];
  const customers = all.filter((p) => p.role === "customer");
  const staff = all.filter((p) => p.role === "staff");

  const now = new Date();
  const rows = customers.map((c) => {
    const r = computeReadiness(
      visibleLessons,
      (progress ?? []).filter((p) => p.user_id === c.id),
      (submissions ?? []).filter((s) => s.user_id === c.id),
      now,
    );
    const openMessages = ((messages ?? []) as Pick<Message, "customer_id" | "sender_id" | "read_at">[]).filter(
      (m) => m.customer_id === c.id && m.sender_id === c.id && !m.read_at,
    ).length;
    return { c, r, openMessages };
  });

  const counts = Object.fromEntries(STATUSES.map((s) => [s, rows.filter((row) => row.r.status === s).length])) as Record<ReadinessStatus, number>;

  const needle = q.trim().toLowerCase();
  const filtered = rows
    .filter((row) => !needle || `${row.c.first_name} ${row.c.last_name} ${row.c.email}`.toLowerCase().includes(needle))
    .filter((row) => !status || row.r.status === status)
    .sort((a, b) => {
      if (sort === "name") return `${a.c.last_name} ${a.c.first_name}`.localeCompare(`${b.c.last_name} ${b.c.first_name}`, "de");
      if (sort === "activity") return (b.r.lastActivity ?? "").localeCompare(a.r.lastActivity ?? "");
      return b.r.score - a.r.score;
    });

  const href = (next: { status?: ReadinessStatus | null; sort?: Sort }) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    const s = next.status === undefined ? status : next.status;
    if (s) p.set("status", s);
    const so = next.sort ?? sort;
    if (so !== "readiness") p.set("sort", so);
    const str = p.toString();
    return str ? `/admin?${str}` : "/admin";
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
          {status && <input type="hidden" name="status" value={status} />}
          {sort !== "readiness" && <input type="hidden" name="sort" value={sort} />}
          <button className="btn-outline">{t("searchButton")}</button>
        </form>
      </header>

      <nav aria-label={t("status")} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={href({ status: status === s ? null : s })}
            className={`card flex flex-col gap-1 p-4 hover:border-primary ${status === s ? "ring-2 ring-primary" : ""}`}
            aria-current={status === s ? "true" : undefined}
          >
            <ReadinessBadge status={s} />
            <span className="text-2xl font-bold text-primary">{counts[s]}</span>
          </Link>
        ))}
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted">{t("sortBy")}:</span>
          {SORTS.map((s) => (
            <Link key={s} href={href({ sort: s })} className={`rounded-md px-2 py-1 font-semibold ${sort === s ? "bg-primary-light text-primary" : "text-ink hover:text-primary"}`}>
              {t(`sort${s[0].toUpperCase()}${s.slice(1)}` as "sortName")}
            </Link>
          ))}
          {status && <Link href={href({ status: null })} className="text-primary hover:underline">× {t("allStatuses")}</Link>}
        </div>
        <span className="text-xs text-muted">{t("partsHint")}</span>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-primary-light text-xs uppercase text-primary">
            <tr>
              <th className="px-4 py-3">{t("lastName")}, {t("firstName")}</th>
              <th className="px-4 py-3">{t("status")}</th>
              <th className="w-40 px-4 py-3">{t("readiness")}</th>
              <th className="px-4 py-3">{t("parts")}</th>
              <th className="w-36 px-4 py-3">{t("progress")}</th>
              <th className="px-4 py-3">{t("lastActivity")}</th>
              <th className="px-4 py-3">{t("openWork")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-muted">{t("empty")}</td></tr>
            )}
            {filtered.map(({ c, r, openMessages }) => (
              <tr key={c.id} className="border-t border-line align-top hover:bg-page">
                <td className="px-4 py-3">
                  <Link className="font-semibold text-primary hover:underline" href={`/admin/customers/${c.id}`}>
                    {[c.last_name, c.first_name].filter(Boolean).join(", ") || c.email}
                  </Link>
                  <div className="text-xs text-muted">{c.email}</div>
                </td>
                <td className="px-4 py-3">
                  <ReadinessBadge status={r.status} />
                  {r.reasons[0] && <div className="mt-1 max-w-56 text-xs text-muted">{tr(`reasons.${r.reasons[0]}`)}</div>}
                </td>
                <td className="px-4 py-3"><ProgressBar value={r.score} label={t("readiness")} /></td>
                <td className="px-4 py-3"><PartChips parts={r.parts} /></td>
                <td className="px-4 py-3"><ProgressBar value={r.percent} label={t("progress")} /></td>
                <td className="px-4 py-3 text-muted">{r.lastActivity ? format.dateTime(new Date(r.lastActivity), { dateStyle: "medium" }) : "–"}</td>
                <td className="space-y-1 px-4 py-3">
                  {openMessages > 0 && <Link href={`/admin/customers/${c.id}#messages`} className="badge bg-accent text-white">{t("open", { count: openMessages })}</Link>}
                  {r.openSubmissions > 0 && <div><span className="badge bg-accent-light text-accent">{t("openSubmissions", { count: r.openSubmissions })}</span></div>}
                  {openMessages === 0 && r.openSubmissions === 0 && <span className="text-muted">–</span>}
                </td>
              </tr>
            ))}
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
