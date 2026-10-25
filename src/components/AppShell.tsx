import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/Logo";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { NavLinks, type NavItem } from "@/components/NavLinks";
import { signOut } from "@/app/actions/auth";
import type { Profile } from "@/lib/types";

export async function AppShell({ profile, items, home, children }: { profile: Profile; items: NavItem[]; home: string; children: React.ReactNode }) {
  const t = await getTranslations("common");
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email;

  return (
    <div className="flex min-h-dvh flex-col pb-20 md:pb-0">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Logo href={home} />
          <nav className="hidden md:block">
            <NavLinks items={items} variant="top" />
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted lg:inline">{name}</span>
            <LanguageSwitch />
            <form action={signOut}>
              <button className="text-sm font-semibold text-primary hover:underline">{t("logout")}</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface md:hidden">
        <NavLinks items={items} variant="bottom" />
      </nav>
    </div>
  );
}
