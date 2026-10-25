import { getTranslations } from "next-intl/server";
import { AppShell } from "@/components/AppShell";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireStaff();
  const t = await getTranslations("nav");
  const supabase = await createClient();
  const { data: unread } = await supabase.from("messages").select("customer_id, sender_id").is("read_at", null);
  const openThreads = new Set((unread ?? []).filter((m) => m.customer_id === m.sender_id).map((m) => m.customer_id)).size;

  const items = [
    { href: "/admin", label: t("customers"), icon: "👥", exact: true },
    { href: "/admin/messages", label: t("inbox"), icon: "💬", badge: openThreads },
    { href: "/admin/submissions", label: t("submissions"), icon: "📝" },
    { href: "/admin/content", label: t("content"), icon: "🛠️" },
    { href: "/admin/profile", label: t("profile"), icon: "👤" },
  ];

  return (
    <AppShell profile={profile} items={items} home="/admin">
      {children}
    </AppShell>
  );
}
