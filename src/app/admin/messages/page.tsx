import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Message, Profile } from "@/lib/types";

export default async function InboxPage() {
  await requireStaff();
  const t = await getTranslations("inbox");
  const format = await getFormatter();
  const supabase = await createClient();

  const [{ data: messages }, { data: customers }] = await Promise.all([
    supabase.from("messages").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("*").eq("role", "customer"),
  ]);
  const byId = new Map(((customers ?? []) as Profile[]).map((c) => [c.id, c]));

  // Ein Eintrag pro Kunde: letzte Nachricht und ob sie von GWS noch beantwortet werden muss.
  const threads = new Map<string, { last: Message; open: number }>();
  for (const m of (messages ?? []) as Message[]) {
    const entry = threads.get(m.customer_id) ?? { last: m, open: 0 };
    if (m.sender_id === m.customer_id && !m.read_at) entry.open += 1;
    threads.set(m.customer_id, entry);
  }
  const rows = [...threads.entries()].sort((a, b) => (b[1].open > 0 ? 1 : 0) - (a[1].open > 0 ? 1 : 0) || b[1].last.created_at.localeCompare(a[1].last.created_at));

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-primary">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("intro")}</p>
      </header>
      {rows.length === 0 ? (
        <p className="card text-muted">{t("empty")}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map(([customerId, { last, open }]) => {
            const c = byId.get(customerId);
            return (
              <li key={customerId}>
                <Link href={`/admin/customers/${customerId}#messages`} className="card flex items-center gap-4 py-4 hover:border-primary">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{c ? `${c.first_name} ${c.last_name}`.trim() || c.email : customerId}</p>
                    <p className="truncate text-sm text-muted">{last.body}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-muted">{format.dateTime(new Date(last.created_at), { dateStyle: "short", timeStyle: "short" })}</p>
                    {open > 0 ? <span className="badge mt-1 bg-accent text-white">{t("open", { count: open })}</span> : <span className="badge mt-1 bg-success-light text-success">{t("answered")}</span>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
