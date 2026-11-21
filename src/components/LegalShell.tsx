import { getLocale, getTranslations } from "next-intl/server";
import { Logo } from "@/components/Logo";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { LegalLinks } from "@/components/LegalLinks";
import { LEGAL } from "@/content/legal";

// Rahmen für Impressum und Datenschutzerklärung: öffentlich, ohne Anmeldung lesbar.
export async function LegalShell({ title, draft, children }: { title: string; draft: boolean; children: React.ReactNode }) {
  const t = await getTranslations("legal");
  const locale = await getLocale();
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Logo />
          <LanguageSwitch />
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <article className="card space-y-4 p-6 text-sm leading-relaxed sm:p-8 [&_a]:text-accent [&_a]:underline [&_h2]:pt-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-primary [&_h3]:pt-1 [&_h3]:font-bold [&_li]:ml-5 [&_li]:list-disc">
          <h1 className="text-2xl font-bold text-primary">{title}</h1>
          {draft && (
            <p role="note" className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900">{t("draft")}</p>
          )}
          {locale !== "de" && <p className="rounded-md bg-accent-light px-3 py-2 text-ink">{t("germanOnly")}</p>}
          {children}
          <p className="pt-4 text-xs text-muted">{t("updated", { date: LEGAL.updated })}</p>
        </article>
      </main>
      <footer className="border-t border-line bg-surface py-4 text-center text-xs text-muted">
        <span>{LEGAL.company}</span>
        <LegalLinks className="ml-4" />
      </footer>
    </div>
  );
}
