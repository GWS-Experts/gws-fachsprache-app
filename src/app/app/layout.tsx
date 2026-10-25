import { getTranslations } from "next-intl/server";
import { AppShell } from "@/components/AppShell";
import { requireCustomer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireCustomer();
  const t = await getTranslations("nav");
  const supabase = await createClient();
  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", profile.id)
    .neq("sender_id", profile.id)
    .is("read_at", null);

  const items = [
    { href: "/app", label: t("learn"), icon: "📚", exact: true },
    { href: "/app/progress", label: t("progress"), icon: "📈" },
    { href: "/app/messages", label: t("messages"), icon: "💬", badge: count ?? 0 },
    { href: "/app/profile", label: t("profile"), icon: "👤" },
  ];

  return (
    <AppShell profile={profile} items={items} home="/app">
      {children}
    </AppShell>
  );
}
