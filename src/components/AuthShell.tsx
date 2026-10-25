import Image from "next/image";
import { Logo } from "@/components/Logo";
import { LanguageSwitch } from "@/components/LanguageSwitch";

export function AuthShell({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Logo />
          <LanguageSwitch />
        </div>
      </header>
      <main className="flex flex-1 items-start justify-center bg-gradient-to-b from-primary-light to-page px-4 py-12">
        <div className="card w-full max-w-md p-8">
          <Image src="/gws-logo.png" alt="" width={96} height={96} className="mx-auto mb-4 h-24 w-24" />
          <h1 className="text-2xl font-bold text-primary">{title}</h1>
          {intro && <p className="mt-2 text-sm text-muted">{intro}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </main>
      <footer className="border-t border-line bg-surface py-4 text-center text-xs text-muted">
        GWS talent transfer GmbH
      </footer>
    </div>
  );
}
