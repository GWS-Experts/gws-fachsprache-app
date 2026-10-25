import Link from "next/link";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { pick, type Lesson, type Locale, type Message, type Profile } from "@/lib/types";
import { MessageComposer } from "@/components/MessageComposer";

// Chat-Verlauf eines Kunden. viewer = angemeldete Person (Kunde oder GWS).
export async function MessageThread({ customerId, viewer, lessonId }: { customerId: string; viewer: Profile; lessonId?: string }) {
  const t = await getTranslations("messages");
  const format = await getFormatter();
  const locale = (await getLocale()) as Locale;
  const supabase = await createClient();

  const { data } = await supabase.from("messages").select("*").eq("customer_id", customerId).order("created_at");
  const messages = (data as Message[]) ?? [];

  const lessonIds = [...new Set([...messages.map((m) => m.lesson_id), lessonId].filter((v): v is string => Boolean(v)))];
  const { data: lessons } = lessonIds.length ? await supabase.from("lessons").select("id, title_de, title_en, module_id").in("id", lessonIds) : { data: [] };
  const lessonById = new Map(((lessons ?? []) as Lesson[]).map((l) => [l.id, l]));

  const senderIds = [...new Set(messages.map((m) => m.sender_id))];
  const { data: senders } = senderIds.length ? await supabase.from("profiles").select("id, first_name, last_name, role").in("id", senderIds) : { data: [] };
  const senderById = new Map(((senders ?? []) as Profile[]).map((p) => [p.id, p]));

  // Ungelesene Nachrichten der Gegenseite als gelesen markieren.
  const unreadFromOther = messages.filter((m) => !m.read_at && (viewer.role === "staff" ? m.sender_id === customerId : m.sender_id !== viewer.id)).map((m) => m.id);
  if (unreadFromOther.length && viewer.role === "customer") {
    await supabase.from("messages").update({ read_at: new Date().toISOString() }).in("id", unreadFromOther);
  }

  const lessonHref = (id: string) => (viewer.role === "staff" ? `/admin/content/lesson/${id}` : `/app/lesson/${id}`);

  return (
    <div className="card flex flex-col gap-4">
      {messages.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">{t("empty")}</p>
      ) : (
        <ul className="space-y-3">
          {messages.map((m) => {
            const mine = m.sender_id === viewer.id;
            const sender = senderById.get(m.sender_id);
            const fromStaff = sender?.role === "staff";
            const name = mine ? t("you") : fromStaff ? `${sender?.first_name ?? ""} · ${t("staff")}`.trim() : [sender?.first_name, sender?.last_name].filter(Boolean).join(" ");
            const lesson = m.lesson_id ? lessonById.get(m.lesson_id) : undefined;
            return (
              <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-lg px-4 py-2.5 ${mine ? "bg-primary text-white" : fromStaff ? "bg-accent-light" : "bg-primary-light"}`}>
                  <p className={`text-xs font-semibold ${mine ? "text-white/80" : "text-primary"}`}>
                    {name} · {format.dateTime(new Date(m.created_at), { dateStyle: "short", timeStyle: "short" })}
                  </p>
                  {lesson && (
                    <Link href={lessonHref(lesson.id)} className={`mt-1 inline-block text-xs underline ${mine ? "text-white/90" : "text-accent"}`}>
                      {t("aboutLesson")}: {pick(lesson, "title", locale)}
                    </Link>
                  )}
                  <p className="mt-1 whitespace-pre-line">{m.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <MessageComposer
        customerId={customerId}
        lessonId={lessonId}
        lessonTitle={lessonId && lessonById.get(lessonId) ? pick(lessonById.get(lessonId)!, "title", locale) : undefined}
        placeholder={viewer.role === "staff" ? t("replyPlaceholder") : t("placeholder")}
      />
    </div>
  );
}
